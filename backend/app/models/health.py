from sqlalchemy import String, Float, Integer, DateTime, Date, JSON, Index, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
from app.db.database import Base


class DailyHealth(Base):
    __tablename__ = "daily_health"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    calendar_date: Mapped[date] = mapped_column(Date, unique=True, index=True)

    # Steps
    total_steps: Mapped[int | None] = mapped_column(Integer)
    step_goal: Mapped[int | None] = mapped_column(Integer)
    total_distance_meters: Mapped[float | None] = mapped_column(Float)

    # Calories
    total_kilocalories: Mapped[int | None] = mapped_column(Integer)
    active_kilocalories: Mapped[int | None] = mapped_column(Integer)
    bmr_kilocalories: Mapped[int | None] = mapped_column(Integer)

    # Heart rate
    resting_heart_rate: Mapped[int | None] = mapped_column(Integer)
    average_heart_rate: Mapped[int | None] = mapped_column(Integer)
    max_heart_rate: Mapped[int | None] = mapped_column(Integer)
    min_heart_rate: Mapped[int | None] = mapped_column(Integer)

    # Body Battery
    body_battery_charged: Mapped[int | None] = mapped_column(Integer)
    body_battery_drained: Mapped[int | None] = mapped_column(Integer)
    body_battery_highest: Mapped[int | None] = mapped_column(Integer)
    body_battery_lowest: Mapped[int | None] = mapped_column(Integer)

    # Stress
    average_stress_level: Mapped[int | None] = mapped_column(Integer)
    max_stress_level: Mapped[int | None] = mapped_column(Integer)
    stress_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    rest_stress_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    activity_stress_duration_seconds: Mapped[int | None] = mapped_column(Integer)

    # Activity minutes
    active_seconds: Mapped[int | None] = mapped_column(Integer)
    sedentary_seconds: Mapped[int | None] = mapped_column(Integer)
    sleeping_seconds: Mapped[int | None] = mapped_column(Integer)

    # HRV
    hrv_weekly_average: Mapped[float | None] = mapped_column(Float)
    hrv_last_night: Mapped[float | None] = mapped_column(Float)
    hrv_status: Mapped[str | None] = mapped_column(String(32))

    raw_data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class SleepData(Base):
    __tablename__ = "sleep_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    calendar_date: Mapped[date] = mapped_column(Date, unique=True, index=True)

    # Duration
    sleep_time_seconds: Mapped[int | None] = mapped_column(Integer)
    nap_time_seconds: Mapped[int | None] = mapped_column(Integer)
    awake_time_seconds: Mapped[int | None] = mapped_column(Integer)
    deep_sleep_seconds: Mapped[int | None] = mapped_column(Integer)
    light_sleep_seconds: Mapped[int | None] = mapped_column(Integer)
    rem_sleep_seconds: Mapped[int | None] = mapped_column(Integer)
    unmeasurable_sleep_seconds: Mapped[int | None] = mapped_column(Integer)

    # Times
    sleep_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sleep_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Score
    sleep_score: Mapped[int | None] = mapped_column(Integer)
    sleep_score_feedback: Mapped[str | None] = mapped_column(String(128))
    sleep_score_insight: Mapped[str | None] = mapped_column(String(256))

    # Stages
    average_hrv: Mapped[float | None] = mapped_column(Float)
    average_resting_heart_rate: Mapped[int | None] = mapped_column(Integer)
    average_sp_o2: Mapped[float | None] = mapped_column(Float)

    raw_data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class TrainingStatus(Base):
    __tablename__ = "training_status"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    calendar_date: Mapped[date] = mapped_column(Date, unique=True, index=True)

    vo2_max: Mapped[float | None] = mapped_column(Float)
    vo2_max_status: Mapped[str | None] = mapped_column(String(64))
    training_readiness: Mapped[int | None] = mapped_column(Integer)
    training_readiness_description: Mapped[str | None] = mapped_column(String(128))
    training_status: Mapped[str | None] = mapped_column(String(64))
    recovery_time_hours: Mapped[int | None] = mapped_column(Integer)

    raw_data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class SyncLog(Base):
    __tablename__ = "sync_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sync_type: Mapped[str] = mapped_column(String(32))  # "full" | "incremental" | "manual"
    status: Mapped[str] = mapped_column(String(32))  # "running" | "success" | "error"
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    activities_synced: Mapped[int] = mapped_column(Integer, default=0)
    health_days_synced: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict | None] = mapped_column(JSON)

    __table_args__ = (
        Index("ix_sync_log_started", "started_at"),
    )