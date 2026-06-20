import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.sync_service import sync_service
import asyncio
from app.schemas.stats import SyncStatusResponse, SyncRequest
from app.core.config import settings

router = APIRouter(prefix="/sync", tags=["sync"])

@router.get("/status", response_model=SyncStatusResponse)
async def get_sync_status(db: AsyncSession = Depends(get_db)):
    return await sync_service.get_status(db)

@router.post("", status_code=202)
async def trigger_sync(
    req: SyncRequest,
    x_sync_pin: str | None = Header(default=None, alias="X-Sync-Pin"),
):
    # Pin is only required for syncs over 7 days
    if req.days > 7:
        if not x_sync_pin or not settings.sync_pin or not hmac.compare_digest(x_sync_pin, settings.sync_pin):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid sync pin")

    # Fire-and-forget an async task to perform manual sync
    asyncio.create_task(
        sync_service.manual_sync(
            days=req.days,
            sync_activities=req.sync_activities,
            sync_sleep=req.sync_sleep,
            sync_health=req.sync_health,
        )
    )
    return {"message": "Sync triggered"}
