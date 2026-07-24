from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class ActivitySettings(Base):
    __tablename__ = "activity_settings"

    activity_type: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    split_mode: Mapped[str] = mapped_column(String(32), default="days")
    layout_mode: Mapped[str] = mapped_column(String(32), default="default")
    view_mode: Mapped[str] = mapped_column(String(16), default="timeline")
    goal_unit: Mapped[str] = mapped_column(String(16), default="minutes")
    goal_value: Mapped[float | None] = mapped_column(Float, default=None)
