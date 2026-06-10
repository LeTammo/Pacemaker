"""
Sync service: fetches data from Garmin and persists it in the local database.
"""

from datetime import datetime, date, timedelta, timezone
from typing import Any
import math

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import AsyncSessionLocal
from app.models.activity import Activity
from app.models.health import DailyHealth, SleepData, TrainingStatus, SyncLog
from app.services.garmin import garmin_service
from app.core.config import settings
from app.core.logging import logger


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_float(val: Any) -> float | None:
    try:
        return float(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def _safe_int(val: Any) -> int | None:
    try:
        return int(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def _parse_dt(val: Any) -> datetime | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    try:
        # Garmin usually returns ISO strings
        s = str(val).replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    except Exception:
        return None


def _ms_to_sec_per_km(speed_ms: float | None) -> float | None:
    """Convert m/s to seconds per km."""
    if speed_ms and speed_ms > 0:
        return 1000.0 / speed_ms
    return None


def _normalize_activity_type(raw: dict) -> str:
    key = raw.get("activityType", {})
    if isinstance(key, dict):
        return key.get("typeKey", "unknown")
    return str(key) if key else "unknown"


# ── Activity transformation ───────────────────────────────────────────────────


def compute_per_km_splits(metric_descriptors: list | None, detail_metrics: list | None, total_distance_m: float | None) -> list | None:
    """Compute per-km splits from activityDetailMetrics using metric_descriptors.

    Returns an array of splits with fields:
      - index (1-based)
      - split_distance_m
      - split_time_s
      - pace_s_per_km
      - cumulative_time_s
      - cumulative_distance_m
    """
    if not metric_descriptors or not detail_metrics:
        return None

    # Build key -> metricsIndex map
    idx_map: dict[str, int] = {}
    for d in metric_descriptors:
        k = d.get("key")
        mi = d.get("metricsIndex")
        if k and mi is not None:
            idx_map[k] = int(mi)

    # Try to find sumDuration and sumDistance indices (be flexible with naming)
    sum_duration_idx = idx_map.get("sumDuration") or idx_map.get("sumElapsedDuration") or idx_map.get("sumMovingDuration")
    sum_distance_idx = idx_map.get("sumDistance") or idx_map.get("sumDistanceMeters")

    if sum_duration_idx is None or sum_distance_idx is None:
        return None

    # Extract cumulative tuples (distance_m, time_s) from detail_metrics
    points: list[tuple[float, float]] = []
    for entry in detail_metrics:
        metrics = entry.get("metrics") if isinstance(entry, dict) else None
        if not metrics or len(metrics) <= max(sum_duration_idx, sum_distance_idx):
            continue
        try:
            cum_time = metrics[sum_duration_idx]
            cum_dist = metrics[sum_distance_idx]
            if cum_time is None or cum_dist is None:
                continue
            # Ensure floats
            cum_time = float(cum_time)
            cum_dist = float(cum_dist)
            # Ignore NaNs
            if not (cum_time >= 0 and cum_dist >= 0):
                continue
            points.append((cum_dist, cum_time))
        except Exception:
            continue

    if not points:
        return None

    # Ensure points are sorted by cumulative time (or distance)
    points.sort(key=lambda x: (x[1], x[0]))

    # If total_distance_m provided, cap target at that, otherwise use last point distance
    final_distance = float(total_distance_m) if total_distance_m else points[-1][0]
    if final_distance <= 0:
        return None

    splits: list[dict] = []
    next_target = 1000.0
    prev_dist, prev_time = points[0]
    # if first point has distance >0 but prev may be 0 - ensure starting at (0,0)
    if prev_time != 0 and prev_dist != 0:
        # prepend origin
        points.insert(0, (0.0, 0.0))
        prev_dist, prev_time = 0.0, 0.0

    i = 0
    point_count = len(points)
    # iterate targets until pass final_distance
    split_index = 1
    while next_target <= final_distance + 1e-6:
        # advance to the segment containing next_target
        while i + 1 < point_count and points[i+1][0] < next_target:
            i += 1
        if i + 1 >= point_count:
            # no further points to interpolate; break
            break
        d0, t0 = points[i]
        d1, t1 = points[i+1]
        if d1 == d0:
            frac = 0.0
        else:
            frac = (next_target - d0) / (d1 - d0)
            frac = max(0.0, min(1.0, frac))
        target_time = t0 + frac * (t1 - t0)
        # compute previous target cumulative time
        prev_target = (split_index - 1) * 1000.0
        # find prev_target_time: either exact previous split or interpolate from points
        if split_index == 1:
            prev_target_time = 0.0
        else:
            prev_target_time = splits[-1]["cumulative_time_s"]
        split_time = target_time - prev_target_time
        if split_time <= 0:
            pace = None
        else:
            pace = split_time / (1000.0 / 1000.0) if 1000.0 else None
        splits.append({
            "index": split_index,
            "split_distance_m": round(min(1000.0, next_target - prev_target), 3),
            "split_time_s": round(split_time, 3),
            "pace_s_per_km": round(split_time, 3) if split_time > 0 else None,
            "cumulative_time_s": round(target_time, 3),
            "cumulative_distance_m": round(next_target, 3),
        })
        split_index += 1
        next_target += 1000.0

    # Optionally include final partial split if final_distance not exact multiple
    last_target = (split_index - 1) * 1000.0
    if final_distance - last_target > 1e-3:
        # find time at final_distance by interpolating between last two points
        # find segment containing final_distance
        j = point_count - 2
        while j >= 0 and points[j+1][0] < final_distance:
            j -= 1
        if j < 0:
            j = 0
        d0, t0 = points[j]
        d1, t1 = points[j+1] if j+1 < point_count else points[j]
        if d1 == d0:
            frac = 0.0
        else:
            frac = (final_distance - d0) / (d1 - d0)
            frac = max(0.0, min(1.0, frac))
        final_time = t0 + frac * (t1 - t0)
        prev_target_time = splits[-1]["cumulative_time_s"] if splits else 0.0
        split_time = final_time - prev_target_time
        splits.append({
            "index": split_index,
            "split_distance_m": round(final_distance - last_target, 3),
            "split_time_s": round(split_time, 3),
            "pace_s_per_km": round(split_time * (1000.0 / (final_distance - last_target)), 3) if split_time > 0 else None,
            "cumulative_time_s": round(final_time, 3),
            "cumulative_distance_m": round(final_distance, 3),
            "partial": True,
        })

    return splits


def transform_activity(raw: dict) -> dict:
    """Map Garmin API dict to Activity model fields."""
    activity_id = str(raw.get("activityId", ""))
    activity_type = _normalize_activity_type(raw)
    avg_speed = _safe_float(raw.get("averageSpeed"))

    # Preserve raw splitSummaries/laps, but compute per-km splits for running activities when possible
    native_summaries = raw.get("splitSummaries") or raw.get("splits") or None
    laps = raw.get("lapSummaries") or raw.get("laps") or None

    computed_splits = None
    try:
        if activity_type == "running":
            metric_descriptors = raw.get("metricDescriptors")
            detail_metrics = raw.get("activityDetailMetrics")
            total_distance = _safe_float(raw.get("distance"))
            computed = compute_per_km_splits(metric_descriptors, detail_metrics, total_distance)
            if computed:
                computed_splits = computed
    except Exception:
        # don't fail entire transform if split computation fails
        computed_splits = None

    return {
        "garmin_id": activity_id,
        "name": raw.get("activityName"),
        "activity_type": activity_type,
        "activity_type_key": activity_type,
        "start_time": _parse_dt(raw.get("startTimeGMT") or raw.get("startTimeLocal")),
        "start_time_local": _parse_dt(raw.get("startTimeLocal")),
        "timezone": raw.get("timeZoneId"),
        "duration_seconds": _safe_float(raw.get("duration")),
        "elapsed_duration_seconds": _safe_float(raw.get("elapsedDuration")),
        "moving_duration_seconds": _safe_float(raw.get("movingDuration")),
        "distance_meters": _safe_float(raw.get("distance")),
        "average_speed": avg_speed,
        "max_speed": _safe_float(raw.get("maxSpeed")),
        "average_pace_seconds": _ms_to_sec_per_km(avg_speed),
        "average_heart_rate": _safe_int(raw.get("averageHR")),
        "max_heart_rate": _safe_int(raw.get("maxHR")),
        "calories": _safe_int(raw.get("calories")),
        "elevation_gain": _safe_float(raw.get("elevationGain")),
        "elevation_loss": _safe_float(raw.get("elevationLoss")),
        "min_elevation": _safe_float(raw.get("minElevation")),
        "max_elevation": _safe_float(raw.get("maxElevation")),
        "average_cadence": _safe_int(raw.get("averageBikingCadenceInRevPerMinute") or raw.get("averageRunningCadenceInStepsPerMinute")),
        "average_running_cadence": _safe_float(raw.get("averageRunningCadenceInStepsPerMinute")),
        "max_running_cadence": _safe_float(raw.get("maxRunningCadenceInStepsPerMinute")),
        "average_stride_length": _safe_float(raw.get("averageStrideLength")),
        "vertical_oscillation": _safe_float(raw.get("avgVerticalOscillation")),
        "ground_contact_time": _safe_float(raw.get("avgGroundContactTime")),
        "lap_count": _safe_int(raw.get("lapCount")),
        "has_splits": bool(raw.get("hasSplits")) if raw.get("hasSplits") is not None else None,
        "has_intensity_intervals": bool(raw.get("hasIntensityIntervals")) if raw.get("hasIntensityIntervals") is not None else None,
        "fastest_split_1000": _safe_float(raw.get("fastestSplit_1000")),
        "fastest_split_1609": _safe_float(raw.get("fastestSplit_1609")),
        "pool_length": _safe_float(raw.get("poolLength")),
        "average_swolf": _safe_float(raw.get("averageSwolf")),
        "average_swim_cadence": _safe_float(raw.get("averageSwimCadenceInStrokesPerMinute")),
        "stroke_type": raw.get("strokeType"),
        "active_lengths": _safe_int(raw.get("activeLengths")),
        "strokes": _safe_float(raw.get("strokes")),
        "average_strokes": _safe_float(raw.get("avgStrokes")),
        "water_estimated": _safe_float(raw.get("waterEstimated")),
        "start_latitude": _safe_float(raw.get("startLatitude")),
        "start_longitude": _safe_float(raw.get("startLongitude")),
        "end_latitude": _safe_float(raw.get("endLatitude")),
        "end_longitude": _safe_float(raw.get("endLongitude")),
        "has_gps": bool(raw.get("hasPolyline") or raw.get("startLatitude")),
        "training_effect": _safe_float(raw.get("aerobicTrainingEffect")),
        "anaerobic_training_effect": _safe_float(raw.get("anaerobicTrainingEffect")),
        "vo2_max": _safe_float(raw.get("vO2MaxValue")),
        "splits": computed_splits or native_summaries,
        "laps": laps,
        "raw_data": raw,
        "synced_at": datetime.now(timezone.utc),
    }


# ── Health transformation ─────────────────────────────────────────────────────

def transform_daily_health(raw: dict, calendar_date: date) -> dict:
    return {
        "calendar_date": calendar_date,
        "total_steps": _safe_int(raw.get("totalSteps")),
        "step_goal": _safe_int(raw.get("dailyStepGoal")),
        "total_distance_meters": _safe_float(raw.get("totalDistanceMeters")),
        "total_kilocalories": _safe_int(raw.get("totalKilocalories")),
        "active_kilocalories": _safe_int(raw.get("activeKilocalories")),
        "bmr_kilocalories": _safe_int(raw.get("bmrKilocalories")),
        "resting_heart_rate": _safe_int(raw.get("restingHeartRate")),
        "average_heart_rate": _safe_int(raw.get("averageHeartRate")),
        "max_heart_rate": _safe_int(raw.get("maxHeartRate")),
        "min_heart_rate": _safe_int(raw.get("minHeartRate")),
        "average_stress_level": _safe_int(raw.get("averageStressLevel")),
        "max_stress_level": _safe_int(raw.get("maxStressLevel")),
        "stress_duration_seconds": _safe_int(raw.get("stressDuration")),
        "rest_stress_duration_seconds": _safe_int(raw.get("restStressDuration")),
        "active_seconds": _safe_int(raw.get("activeSeconds")),
        "sedentary_seconds": _safe_int(raw.get("sedentarySeconds")),
        "sleeping_seconds": _safe_int(raw.get("sleepingSeconds")),
        "raw_data": raw,
    }


def transform_sleep(raw: dict, calendar_date: date) -> dict | None:
    daily = raw.get("dailySleepDTO")
    if not daily:
        return None
    return {
        "calendar_date": calendar_date,
        "sleep_time_seconds": _safe_int(daily.get("sleepTimeSeconds")),
        "nap_time_seconds": _safe_int(daily.get("napTimeSeconds")),
        "awake_time_seconds": _safe_int(daily.get("awakeSleepSeconds")),
        "deep_sleep_seconds": _safe_int(daily.get("deepSleepSeconds")),
        "light_sleep_seconds": _safe_int(daily.get("lightSleepSeconds")),
        "rem_sleep_seconds": _safe_int(daily.get("remSleepSeconds")),
        "unmeasurable_sleep_seconds": _safe_int(daily.get("unmeasurableSleepSeconds")),
        "sleep_start": _parse_dt(daily.get("sleepStartTimestampGMT")),
        "sleep_end": _parse_dt(daily.get("sleepEndTimestampGMT")),
        "sleep_score": _safe_int(daily.get("sleepScores", {}).get("overall", {}).get("value")),
        "sleep_score_feedback": daily.get("sleepScores", {}).get("overall", {}).get("qualifierKey"),
        "average_hrv": _safe_float(daily.get("avgSleepHRV")),
        "average_resting_heart_rate": _safe_int(daily.get("avgSleepHR")),
        "average_sp_o2": _safe_float(daily.get("averageSpO2Value")),
        "raw_data": raw,
    }


# ── Sync engine ────────────────────────────────────────────────────────────────

class SyncService:
    async def _create_sync_log(
        self, session: AsyncSession, sync_type: str
    ) -> SyncLog:
        log = SyncLog(sync_type=sync_type, status="running")
        session.add(log)
        await session.commit()
        await session.refresh(log)
        return log

    async def _finish_sync_log(
        self,
        session: AsyncSession,
        log: SyncLog,
        status: str,
        activities_synced: int = 0,
        health_days_synced: int = 0,
        error: str | None = None,
        details: dict | None = None,
    ) -> None:
        log.status = status
        log.finished_at = datetime.now(timezone.utc)
        log.activities_synced = activities_synced
        log.health_days_synced = health_days_synced
        log.error_message = error
        log.details = details
        await session.commit()

    async def sync_activities(
        self, session: AsyncSession, start_date: date, end_date: date
    ) -> int:
        """Fetch and upsert activities for a date range."""
        logger.info("Syncing activities", start=str(start_date), end=str(end_date))
        raw_activities = await garmin_service.get_activities_by_date(start_date, end_date)

        synced = 0
        for raw in raw_activities:
            try:
                activity_type = _normalize_activity_type(raw)
                activity_id = str(raw.get("activityId", ""))
                if activity_type in {"running", "lap_swimming"} and activity_id:
                    try:
                        details = await garmin_service.get_activity_details(activity_id)
                        if details:
                            merged = dict(raw)
                            merged.update(details)
                            raw = merged
                            logger.info(
                                "Loaded detailed activity payload",
                                activity_id=activity_id,
                                activity_type=activity_type,
                            )
                    except Exception as e:
                        logger.warning(
                            "Could not load detailed activity payload",
                            activity_id=activity_id,
                            activity_type=activity_type,
                            error=str(e),
                        )

                data = transform_activity(raw)
                garmin_id = data["garmin_id"]
                if not garmin_id:
                    continue

                existing = await session.scalar(
                    select(Activity).where(Activity.garmin_id == garmin_id)
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(Activity(**data))
                synced += 1
            except Exception as e:
                logger.warning(
                    "Failed to process activity",
                    error=str(e),
                    activity_id=raw.get("activityId"),
                )

        await session.commit()
        logger.info("Activities synced", count=synced)
        return synced

    async def sync_health_day(self, session: AsyncSession, target_date: date) -> bool:
        """Fetch and upsert health data for a single day."""
        try:
            raw = await garmin_service.get_daily_stats(target_date)
            if raw:
                data = transform_daily_health(raw, target_date)
                existing = await session.scalar(
                    select(DailyHealth).where(DailyHealth.calendar_date == target_date)
                )
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(DailyHealth(**data))

            # Sleep
            sleep_raw = await garmin_service.get_sleep_data(target_date)
            sleep_data = transform_sleep(sleep_raw, target_date)
            if sleep_data:
                existing_sleep = await session.scalar(
                    select(SleepData).where(SleepData.calendar_date == target_date)
                )
                if existing_sleep:
                    for k, v in sleep_data.items():
                        setattr(existing_sleep, k, v)
                else:
                    session.add(SleepData(**sleep_data))

            await session.commit()
            return True
        except Exception as e:
            logger.warning("Failed to sync health day", date=str(target_date), error=str(e))
            await session.rollback()
            return False

    async def full_sync(self) -> SyncLog:
        """Initial full import of all historical data."""
        async with AsyncSessionLocal() as session:
            log = await self._create_sync_log(session, "full")
            logger.info("Starting full sync", sync_id=log.id)

            try:
                end_date = date.today()
                start_date = end_date - timedelta(days=settings.sync_initial_days)

                total_activities = await self.sync_activities(session, start_date, end_date)

                health_days = 0
                current = start_date
                while current <= end_date:
                    if await self.sync_health_day(session, current):
                        health_days += 1
                    current += timedelta(days=1)

                await self._finish_sync_log(
                    session, log, "success",
                    activities_synced=total_activities,
                    health_days_synced=health_days,
                )
                logger.info("Full sync complete", activities=total_activities, health_days=health_days)
            except Exception as e:
                logger.error("Full sync failed", error=str(e))
                await self._finish_sync_log(session, log, "error", error=str(e))

            return log

    async def incremental_sync(self) -> SyncLog:
        """Incremental update for recent days."""
        async with AsyncSessionLocal() as session:
            log = await self._create_sync_log(session, "incremental")
            logger.info("Starting incremental sync", sync_id=log.id)

            try:
                end_date = date.today()
                start_date = end_date - timedelta(days=settings.sync_incremental_days)

                total_activities = await self.sync_activities(session, start_date, end_date)

                health_days = 0
                current = start_date
                while current <= end_date:
                    if await self.sync_health_day(session, current):
                        health_days += 1
                    current += timedelta(days=1)

                await self._finish_sync_log(
                    session, log, "success",
                    activities_synced=total_activities,
                    health_days_synced=health_days,
                )
                logger.info("Incremental sync complete", activities=total_activities)
            except Exception as e:
                logger.error("Incremental sync failed", error=str(e))
                await self._finish_sync_log(session, log, "error", error=str(e))

            return log

    async def manual_sync(self) -> SyncLog:
        """Manual sync triggered by user."""
        async with AsyncSessionLocal() as session:
            # Check if a full sync has ever run
            last_full = await session.scalar(
                select(SyncLog)
                .where(SyncLog.sync_type == "full", SyncLog.status == "success")
                .order_by(SyncLog.started_at.desc())
            )

        if last_full is None:
            return await self.full_sync()
        return await self.incremental_sync()

    async def get_status(self, session: AsyncSession) -> dict:
        """Get the latest sync status."""
        last_sync = await session.scalar(
            select(SyncLog).order_by(SyncLog.started_at.desc()).limit(1)
        )
        
        if not last_sync:
            return {"status": "never_synced"}
            
        return {
            "last_sync": last_sync.finished_at,
            "status": last_sync.status,
            "activities_synced": last_sync.activities_synced,
            "error": last_sync.error_message
        }


sync_service = SyncService()
