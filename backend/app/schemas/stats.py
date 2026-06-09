from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Any


# ── Stats ──────────────────────────────────────────────────────────────────────

class StatsResponse(BaseModel):
    total_activities: int
    total_distance: float


class ActivityStats(BaseModel):
    total_activities: int
    total_distance_km: float
    total_running_distance_km: float
    total_swimming_distance_km: float
    total_cycling_distance_km: float
    activities_this_week: int
    activities_this_month: int
    average_activities_per_week: float
    average_distance_per_week_km: float
    total_duration_hours: float
    total_calories: int


class RunningStats(BaseModel):
    total_runs: int
    total_distance_km: float
    average_pace_seconds: float | None
    longest_run_km: float | None
    fastest_pace_seconds: float | None
    average_heart_rate: float | None
    weekly_mileage: list[dict]
    monthly_mileage: list[dict]
    pace_over_time: list[dict]
    runs_per_week: list[dict]


class SwimmingStats(BaseModel):
    total_swims: int
    total_distance_km: float
    total_duration_seconds: float
    average_duration_seconds: float | None
    frequency_per_week: float
    distance_over_time: list[dict]


class GeneralStats(BaseModel):
    activities_per_week: list[dict]
    activities_per_month: list[dict]
    total_active_hours: float
    activity_type_distribution: list[dict]


# ── Health ─────────────────────────────────────────────────────────────────────

class DailyHealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    calendar_date: date
    total_steps: int | None
    step_goal: int | None
    total_kilocalories: int | None
    active_kilocalories: int | None
    resting_heart_rate: int | None
    average_heart_rate: int | None
    body_battery_highest: int | None
    body_battery_lowest: int | None
    average_stress_level: int | None
    active_seconds: int | None
    sedentary_seconds: int | None
    hrv_last_night: float | None
    hrv_weekly_average: float | None
    hrv_status: str | None


class SleepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    calendar_date: date
    sleep_time_seconds: int | None
    deep_sleep_seconds: int | None
    light_sleep_seconds: int | None
    rem_sleep_seconds: int | None
    awake_time_seconds: int | None
    sleep_start: datetime | None
    sleep_end: datetime | None
    sleep_score: int | None
    average_hrv: float | None
    average_resting_heart_rate: int | None


class TrainingStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    calendar_date: date
    vo2_max: float | None
    vo2_max_status: str | None
    training_readiness: int | None
    training_readiness_description: str | None
    training_status: str | None
    recovery_time_hours: int | None


# ── Sync ───────────────────────────────────────────────────────────────────────

class SyncStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sync_type: str
    status: str
    started_at: datetime
    finished_at: datetime | None
    activities_synced: int
    health_days_synced: int
    error_message: str | None
    details: Any | None


class SyncTriggerResponse(BaseModel):
    message: str
    sync_id: int


# ── Calendar ───────────────────────────────────────────────────────────────────

class CalendarDay(BaseModel):
    date: date
    count: int
    distance_km: float
    duration_seconds: float
    activity_types: list[str]


class CalendarResponse(BaseModel):
    days: list[CalendarDay]
    year: int