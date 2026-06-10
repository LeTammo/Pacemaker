from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.activity import Activity
from app.schemas.stats import StatsResponse, ActivityStats
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/", response_model=ActivityStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Totals
    total_q = select(func.count(Activity.id), func.coalesce(func.sum(Activity.distance_meters), 0))
    res = await db.execute(total_q)
    total_count, total_distance = res.one()

    # Running distance
    run_q = select(
        func.coalesce(func.sum(Activity.distance_meters), 0),
        func.count(Activity.id),
        func.coalesce(func.avg(Activity.distance_meters), 0),
        func.coalesce(func.avg(Activity.average_pace_seconds), 0),
        func.coalesce(func.min(Activity.average_pace_seconds), 0),
    ).where(Activity.activity_type == 'running')
    run_res = await db.execute(run_q)
    running_distance, total_runs, avg_run_distance, avg_run_pace, fastest_run_pace = run_res.one()

    # Swimming distance
    swim_q = select(
        func.coalesce(func.sum(Activity.distance_meters), 0),
        func.count(Activity.id),
        func.coalesce(func.avg(Activity.distance_meters), 0),
    ).where(Activity.activity_type.in_(['lap_swimming', 'swimming', 'lap-swimming', 'swim', 'lap_swim']))
    swim_res = await db.execute(swim_q)
    swimming_distance, total_swims, avg_swim_distance = swim_res.one()

    # Activities this week/month
    today = date.today()
    start_week = datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time())
    start_month = datetime.combine(today.replace(day=1), datetime.min.time())

    week_q = select(func.count(Activity.id)).where(Activity.start_time >= start_week)
    month_q = select(func.count(Activity.id)).where(Activity.start_time >= start_month)
    week_res = await db.execute(week_q)
    month_res = await db.execute(month_q)
    activities_this_week = week_res.scalar_one() or 0
    activities_this_month = month_res.scalar_one() or 0

    # Simple averages
    avg_per_week = (total_count / 52) if total_count else 0
    avg_distance_per_week_km = (total_distance / 1000.0) / 52 if total_distance else 0

    # Totals duration and calories
    dur_q = select(func.coalesce(func.sum(Activity.duration_seconds), 0))
    dur_res = await db.execute(dur_q)
    total_duration = dur_res.scalar_one() or 0

    longest_run_q = select(func.coalesce(func.max(Activity.distance_meters), 0)).where(Activity.activity_type == 'running')
    longest_run_res = await db.execute(longest_run_q)
    longest_run = longest_run_res.scalar_one() or 0

    avg_run_distance_km = round((avg_run_distance or 0) / 1000.0, 2) if total_runs else None
    avg_swim_distance_km = round((avg_swim_distance or 0) / 1000.0, 2) if total_swims else None

    return ActivityStats(
        total_activities=total_count or 0,
        total_distance_km=round((total_distance or 0)/1000.0,2),
        total_running_distance_km=round((running_distance or 0)/1000.0,2),
        total_swimming_distance_km=round((swimming_distance or 0)/1000.0,2),
        total_cycling_distance_km=0.0,
        average_activity_distance_km=round((total_distance or 0) / max(total_count or 1, 1) / 1000.0, 2),
        average_activity_duration_minutes=round((total_duration or 0) / max(total_count or 1, 1) / 60.0, 1),
        total_runs=total_runs or 0,
        total_swims=total_swims or 0,
        longest_run_km=round((longest_run or 0) / 1000.0, 2) if longest_run else None,
        average_run_pace_seconds=round(avg_run_pace, 2) if avg_run_pace else None,
        fastest_run_pace_seconds=round(fastest_run_pace, 2) if fastest_run_pace else None,
        average_run_distance_km=avg_run_distance_km,
        average_swim_distance_km=avg_swim_distance_km,
        activities_this_week=activities_this_week,
        activities_this_month=activities_this_month,
        average_activities_per_week=round(avg_per_week,2),
        average_distance_per_week_km=round(avg_distance_per_week_km,2),
        total_duration_hours=round((total_duration or 0)/3600.0,2),
        average_runs_per_week=round((total_runs or 0) / 52, 2),
        average_swims_per_week=round((total_swims or 0) / 52, 2),
    )
