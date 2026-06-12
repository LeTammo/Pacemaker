from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.activity import Activity
from app.schemas.stats import StatsResponse, ActivityStats, SportStatsResponse
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/stats", tags=["stats"])

SWIM_TYPES = ['lap_swimming', 'swimming', 'lap-swimming', 'swim', 'lap_swim']


def _week_bounds(ref_date: date) -> tuple[datetime, datetime]:
    """Return (Monday 00:00, next-Monday 00:00) for the ISO week containing ref_date."""
    monday = ref_date - timedelta(days=ref_date.weekday())
    return (
        datetime.combine(monday, datetime.min.time()),
        datetime.combine(monday + timedelta(days=7), datetime.min.time()),
    )


def _month_bounds(ref_date: date) -> tuple[datetime, datetime]:
    """Return (first of month 00:00, first of next month 00:00)."""
    first = ref_date.replace(day=1)
    if first.month == 12:
        next_first = first.replace(year=first.year + 1, month=1)
    else:
        next_first = first.replace(month=first.month + 1)
    return (
        datetime.combine(first, datetime.min.time()),
        datetime.combine(next_first, datetime.min.time()),
    )


@router.get("/", response_model=ActivityStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    today = date.today()

    # ── Date window helpers ────────────────────────────────────────────────────
    this_week_start, this_week_end = _week_bounds(today)
    last_week_start = this_week_start - timedelta(days=7)
    last_week_end = this_week_start

    this_month_start, this_month_end = _month_bounds(today)
    # Previous calendar month
    first_of_this_month = today.replace(day=1)
    last_month_end = datetime.combine(first_of_this_month, datetime.min.time())
    last_month_date = (first_of_this_month - timedelta(days=1)).replace(day=1)
    last_month_start, _ = _month_bounds(last_month_date)

    # ── Totals ─────────────────────────────────────────────────────────────────
    total_q = select(func.count(Activity.id), func.coalesce(func.sum(Activity.distance_meters), 0))
    res = await db.execute(total_q)
    total_count, total_distance = res.one()

    # ── Running aggregates ─────────────────────────────────────────────────────
    run_q = select(
        func.coalesce(func.sum(Activity.distance_meters), 0),
        func.count(Activity.id),
        func.coalesce(func.avg(Activity.distance_meters), 0),
        func.coalesce(func.avg(Activity.average_pace_seconds), 0),
        func.coalesce(func.min(Activity.average_pace_seconds), 0),
    ).where(Activity.activity_type == 'running')
    run_res = await db.execute(run_q)
    running_distance, total_runs, avg_run_distance, avg_run_pace, fastest_run_pace = run_res.one()

    # ── Swimming aggregates ────────────────────────────────────────────────────
    swim_q = select(
        func.coalesce(func.sum(Activity.distance_meters), 0),
        func.count(Activity.id),
        func.coalesce(func.avg(Activity.distance_meters), 0),
    ).where(Activity.activity_type.in_(SWIM_TYPES))
    swim_res = await db.execute(swim_q)
    swimming_distance, total_swims, avg_swim_distance = swim_res.one()

    # ── Longest run ────────────────────────────────────────────────────────────
    longest_run_q = select(func.coalesce(func.max(Activity.distance_meters), 0)).where(
        Activity.activity_type == 'running'
    )
    longest_run = (await db.execute(longest_run_q)).scalar_one() or 0

    # ── Duration ──────────────────────────────────────────────────────────────
    dur_q = select(func.coalesce(func.sum(Activity.duration_seconds), 0))
    total_duration = (await db.execute(dur_q)).scalar_one() or 0

    # ── Weekly/monthly activity counts (all types) ─────────────────────────────
    week_q = select(func.count(Activity.id)).where(
        Activity.start_time >= this_week_start, Activity.start_time < this_week_end
    )
    last_week_q = select(func.count(Activity.id)).where(
        Activity.start_time >= last_week_start, Activity.start_time < last_week_end
    )
    month_q = select(func.count(Activity.id)).where(
        Activity.start_time >= this_month_start, Activity.start_time < this_month_end
    )
    last_month_all_q = select(func.count(Activity.id)).where(
        Activity.start_time >= last_month_start, Activity.start_time < last_month_end
    )
    activities_this_week = (await db.execute(week_q)).scalar_one() or 0
    activities_last_week = (await db.execute(last_week_q)).scalar_one() or 0
    activities_this_month = (await db.execute(month_q)).scalar_one() or 0
    activities_last_month = (await db.execute(last_month_all_q)).scalar_one() or 0

    # ── Monthly per-sport counts ───────────────────────────────────────────────
    async def count_type_in_range(activity_type_filter, start: datetime, end: datetime) -> int:
        q = select(func.count(Activity.id)).where(
            Activity.activity_type == activity_type_filter if isinstance(activity_type_filter, str)
            else Activity.activity_type.in_(activity_type_filter),
            Activity.start_time >= start,
            Activity.start_time < end,
        )
        return (await db.execute(q)).scalar_one() or 0

    runs_this_month = await count_type_in_range('running', this_month_start, this_month_end)
    runs_last_month = await count_type_in_range('running', last_month_start, last_month_end)
    swims_this_month = await count_type_in_range(SWIM_TYPES, this_month_start, this_month_end)
    swims_last_month = await count_type_in_range(SWIM_TYPES, last_month_start, last_month_end)

    # ── Weekly per-sport distance & pace averages ──────────────────────────────
    async def avg_distance_pace_in_range(activity_type_filter, start: datetime, end: datetime):
        """Returns (avg_distance_km, avg_pace_s) or (None, None) if no activities."""
        if isinstance(activity_type_filter, str):
            cond = Activity.activity_type == activity_type_filter
        else:
            cond = Activity.activity_type.in_(activity_type_filter)
        q = select(
            func.avg(Activity.distance_meters),
            func.avg(Activity.average_pace_seconds),
        ).where(cond, Activity.start_time >= start, Activity.start_time < end)
        row = (await db.execute(q)).one()
        avg_dist = round(row[0] / 1000.0, 2) if row[0] else None
        avg_pace = round(row[1], 2) if row[1] else None
        return avg_dist, avg_pace

    avg_run_dist_this_week, avg_run_pace_this_week = await avg_distance_pace_in_range(
        'running', this_week_start, this_week_end
    )
    avg_run_dist_last_week, avg_run_pace_last_week = await avg_distance_pace_in_range(
        'running', last_week_start, last_week_end
    )
    avg_swim_dist_this_week, avg_swim_pace_this_week = await avg_distance_pace_in_range(
        SWIM_TYPES, this_week_start, this_week_end
    )
    avg_swim_dist_last_week, avg_swim_pace_last_week = await avg_distance_pace_in_range(
        SWIM_TYPES, last_week_start, last_week_end
    )

    # ── Derived averages ───────────────────────────────────────────────────────
    avg_per_week = (total_count / 52) if total_count else 0
    avg_distance_per_week_km = (total_distance / 1000.0) / 52 if total_distance else 0
    avg_run_distance_km = round((avg_run_distance or 0) / 1000.0, 2) if total_runs else None
    avg_swim_distance_km = round((avg_swim_distance or 0) / 1000.0, 2) if total_swims else None

    return ActivityStats(
        total_activities=total_count or 0,
        total_distance_km=round((total_distance or 0) / 1000.0, 2),
        total_running_distance_km=round((running_distance or 0) / 1000.0, 2),
        total_swimming_distance_km=round((swimming_distance or 0) / 1000.0, 2),
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
        activities_last_week=activities_last_week,
        activities_this_month=activities_this_month,
        activities_last_month=activities_last_month,
        average_activities_per_week=round(avg_per_week, 2),
        average_distance_per_week_km=round(avg_distance_per_week_km, 2),
        total_duration_hours=round((total_duration or 0) / 3600.0, 2),
        average_runs_per_week=round((total_runs or 0) / 52, 2),
        average_swims_per_week=round((total_swims or 0) / 52, 2),
        # Monthly per-sport
        runs_this_month=runs_this_month,
        runs_last_month=runs_last_month,
        swims_this_month=swims_this_month,
        swims_last_month=swims_last_month,
        # Weekly per-sport
        avg_run_distance_this_week_km=avg_run_dist_this_week,
        avg_run_distance_last_week_km=avg_run_dist_last_week,
        avg_swim_distance_this_week_km=avg_swim_dist_this_week,
        avg_swim_distance_last_week_km=avg_swim_dist_last_week,
        avg_run_pace_this_week_seconds=avg_run_pace_this_week,
        avg_run_pace_last_week_seconds=avg_run_pace_last_week,
        avg_swim_pace_this_week_seconds=avg_swim_pace_this_week,
        avg_swim_pace_last_week_seconds=avg_swim_pace_last_week,
    )


@router.get("/activity/{activity_type}", response_model=SportStatsResponse)
async def get_activity_stats(activity_type: str, db: AsyncSession = Depends(get_db)):
    today = date.today()

    this_week_start, this_week_end = _week_bounds(today)
    last_week_start = this_week_start - timedelta(days=7)
    last_week_end = this_week_start

    if activity_type in SWIM_TYPES:
        cond = Activity.activity_type.in_(SWIM_TYPES)
    else:
        cond = Activity.activity_type == activity_type

    # Total and Average distance & duration
    total_q = select(
        func.count(Activity.id),
        func.coalesce(func.avg(Activity.distance_meters), 0),
        func.coalesce(func.avg(Activity.duration_seconds), 0),
    ).where(cond)
    res = await db.execute(total_q)
    total_count, avg_dist, avg_duration = res.one()

    # Weekly metrics averages
    async def avg_metrics_in_range(start: datetime, end: datetime):
        q = select(
            func.avg(Activity.distance_meters),
            func.avg(Activity.average_pace_seconds),
            func.avg(Activity.duration_seconds),
            func.avg(Activity.average_heart_rate),
        ).where(cond, Activity.start_time >= start, Activity.start_time < end)
        row = (await db.execute(q)).one()
        avg_d = round(row[0] / 1000.0, 2) if row[0] else None
        avg_p = round(row[1], 2) if row[1] else None
        avg_dur = round(row[2], 1) if row[2] else None
        avg_hr = round(row[3], 1) if row[3] else None
        return avg_d, avg_p, avg_dur, avg_hr

    avg_dist_this_week, avg_pace_this_week, avg_dur_this_week, avg_hr_this_week = await avg_metrics_in_range(this_week_start, this_week_end)
    avg_dist_last_week, avg_pace_last_week, avg_dur_last_week, avg_hr_last_week = await avg_metrics_in_range(last_week_start, last_week_end)

    return SportStatsResponse(
        activity_type=activity_type,
        total_activities=total_count,
        average_distance_km=round((avg_dist or 0) / 1000.0, 2) if total_count else None,
        avg_distance_this_week_km=avg_dist_this_week,
        avg_distance_last_week_km=avg_dist_last_week,
        avg_pace_this_week_seconds=avg_pace_this_week,
        avg_pace_last_week_seconds=avg_pace_last_week,
        average_duration_seconds=round(avg_duration, 1) if total_count else None,
        avg_duration_this_week_seconds=avg_dur_this_week,
        avg_duration_last_week_seconds=avg_dur_last_week,
        avg_hr_this_week=avg_hr_this_week,
        avg_hr_last_week=avg_hr_last_week,
    )

