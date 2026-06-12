from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import activities, sync, stats, settings as settings_api
from app.services.sync_service import sync_service
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager
from app.core.logging import setup_logging, logger
from app.db.database import init_db

# Initialize structured logging
setup_logging()

app = FastAPI(title=settings.app_name)

# Add CORS so the frontend can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(activities.router, prefix=settings.api_prefix)
app.include_router(sync.router, prefix=settings.api_prefix)
app.include_router(stats.router, prefix=settings.api_prefix)
app.include_router(settings_api.router, prefix=settings.api_prefix)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error("Database init failed", error=str(e))

    # Start scheduler only if enabled
    if settings.enable_auto_sync:
        scheduler = AsyncIOScheduler()
        scheduler.add_job(sync_service.incremental_sync, 'interval', hours=settings.sync_interval_hours)
        scheduler.start()
        logger.info("Auto sync scheduler started", interval_hours=settings.sync_interval_hours)
        try:
            yield
        finally:
            scheduler.shutdown()
            logger.info("Auto sync scheduler stopped")
    else:
        logger.info("Auto sync disabled; manual sync only")
        yield

app.router.lifespan_context = lifespan

@app.get("/")
async def root():
    return {"message": "Welcome to the Garmin Dashboard API"}

if __name__ == "__main__":
    import uvicorn
    # Run the FastAPI app instance directly to avoid import loops when using "module:app"
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
