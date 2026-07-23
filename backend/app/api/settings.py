from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.settings import ActivitySettings
from app.schemas.settings import ActivitySettingsResponse, ActivitySettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/activity/{activity_type}", response_model=ActivitySettingsResponse)
async def get_activity_settings(activity_type: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ActivitySettings).where(ActivitySettings.activity_type == activity_type)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()

    if not settings:
        return ActivitySettings(
            activity_type=activity_type,
            split_mode="days",
            layout_mode="default",
            goal_unit="minutes",
            goal_value=None,
        )
    return settings


@router.put("/activity/{activity_type}", response_model=ActivitySettingsResponse)
async def update_activity_settings(
    activity_type: str,
    payload: ActivitySettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ActivitySettings).where(ActivitySettings.activity_type == activity_type)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()

    if not settings:
        settings = ActivitySettings(
            activity_type=activity_type,
            split_mode=payload.split_mode or "days",
            layout_mode=payload.layout_mode or "default",
            goal_unit=payload.goal_unit or "minutes",
            goal_value=payload.goal_value,
        )
        db.add(settings)
    else:
        if payload.split_mode is not None:
            settings.split_mode = payload.split_mode
        if payload.layout_mode is not None:
            settings.layout_mode = payload.layout_mode
        if payload.goal_unit is not None:
            settings.goal_unit = payload.goal_unit
        if "goal_value" in payload.model_fields_set:
            settings.goal_value = payload.goal_value

    await db.commit()
    await db.refresh(settings)
    return settings


@router.get("/activities", response_model=list[ActivitySettingsResponse])
async def list_all_activity_settings(db: AsyncSession = Depends(get_db)):
    stmt = select(ActivitySettings)
    res = await db.execute(stmt)
    return res.scalars().all()
