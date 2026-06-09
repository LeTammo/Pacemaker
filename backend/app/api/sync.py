from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.sync_service import sync_service
from app.schemas.stats import SyncStatusResponse
import asyncio

router = APIRouter(prefix="/sync", tags=["sync"])

@router.get("/status", response_model=SyncStatusResponse)
async def get_sync_status(db: AsyncSession = Depends(get_db)):
    return await sync_service.get_status(db)

@router.post("/", status_code=202)
async def trigger_sync(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Fire-and-forget an async task to perform manual sync
    asyncio.create_task(sync_service.manual_sync())
    return {"message": "Sync triggered"}
