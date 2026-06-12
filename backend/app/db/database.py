from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import os
import sqlite3
from pathlib import Path

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    from app.models import activity, health, settings as settings_model  # noqa: F401

    def _sqlite_db_path() -> Path | None:
        prefix = "sqlite+aiosqlite:///"
        if not settings.database_url.startswith(prefix):
            return None
        return Path(settings.database_url[len(prefix) :]).expanduser()

    def _schema_needs_reset(db_path: Path) -> bool:
        if not db_path.exists():
            return False

        with sqlite3.connect(db_path) as conn:
            existing_tables = {
                row[0]
                for row in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).fetchall()
            }
            for table in Base.metadata.tables.values():
                if table.name not in existing_tables:
                    continue
                existing_columns = {
                    row[1]
                    for row in conn.execute(f"PRAGMA table_info({table.name})").fetchall()
                }
                expected_columns = {column.name for column in table.columns}
                if not expected_columns.issubset(existing_columns):
                    return True
        return False

    db_path = _sqlite_db_path()
    if db_path is not None and _schema_needs_reset(db_path):
        os.remove(db_path)
        print(f"Schema mismatch detected, removed outdated database at {db_path}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
