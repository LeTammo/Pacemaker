from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.activity import Activity
from datetime import datetime, timedelta
from app.schemas.stats import ActivityStats

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/", response_model=ActivityStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Simple aggregates
    total_activities_query = select(func.count(Activity.id))
    total_running_query = select(func.sum(Activity.distance_meters)).where(Activity.activity_type.icontains("running"))
    total_swimming_query = select(func.sum(Activity.distance_meters)).where(Activity.activity_type.icontains("swim"))
    total_cycling_query = select(func.sum(Activity.distance_meters)).where(Activity.activity_type.icontains("cycle"))
    total_duration_query = select(func.sum(Activity.duration_seconds))
    total_calories_query = select(func.sum(Activity.calories))

    # Executions
    total_activities = (await db.execute(total_activities_query)).scalar() or 0
    total_running_meters = (await db.execute(total_running_query)).scalar() or 0.0
    total_swimming_meters = (await db.execute(total_swimming_query)).scalar() or 0.0
    total_cycling_meters = (await db.execute(total_cycling_query)).scalar() or 0.0
    total_duration_sec = (await db.execute(total_duration_query)).scalar() or 0.0
    total_calories = (await db.execute(total_calories_query)).scalar() or 0

    # Weekly/Monthly limits
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    one_month_ago = datetime.utcnow() - timedelta(days=30)

    weekly_query = select(func.count(Activity.id)).where(Activity.start_time >= one_week_ago)
    monthly_query = select(func.count(Activity.id)).where(Activity.start_time >= one_month_ago)

    weekly_count = (await db.execute(weekly_query)).scalar() or 0
    monthly_count = (await db.execute(monthly_query)).scalar() or 0

    return ActivityStats(
        total_activities=total_activities,
        total_distance_km=round((total_running_meters + total_swimming_meters + total_cycling_meters) / 1000.0, 2),
        total_running_distance_km=round(total_running_meters / 1000.0, 2),
        total_swimming_distance_km=round(total_swimming_meters / 1000.0, 2),
        total_cycling_distance_km=round(total_cycling_meters / 1000.0, 2),
        activities_this_week=weekly_count,
        activities_this_month=monthly_count,
        average_activities_per_week=round(weekly_count, 1),
        average_distance_per_week_km=0.0,
        total_duration_hours=round(total_duration_sec / 3600.0, 1),
        total_calories=int(total_calories)
    )