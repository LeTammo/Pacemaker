from sqlalchemy import String, Float, Integer, DateTime, Boolean, Text, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    garmin_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    # Basic info
    name: Mapped[str | None] = mapped_column(String(256))
    activity_type: Mapped[str] = mapped_column(String(64), index=True)
    activity_type_key: Mapped[str | None] = mapped_column(String(64))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    start_time_local: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    timezone: Mapped[str | None] = mapped_column(String(64))

    # Duration & distance
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    elapsed_duration_seconds: Mapped[float | None] = mapped_column(Float)
    moving_duration_seconds: Mapped[float | None] = mapped_column(Float)
    distance_meters: Mapped[float | None] = mapped_column(Float)

    # Pace & speed
    average_speed: Mapped[float | None] = mapped_column(Float)  # m/s
    max_speed: Mapped[float | None] = mapped_column(Float)
    average_pace_seconds: Mapped[float | None] = mapped_column(Float)  # sec/km

    # Heart rate
    average_heart_rate: Mapped[int | None] = mapped_column(Integer)
    max_heart_rate: Mapped[int | None] = mapped_column(Integer)

    # Calories & elevation
    calories: Mapped[int | None] = mapped_column(Integer)
    elevation_gain: Mapped[float | None] = mapped_column(Float)
    elevation_loss: Mapped[float | None] = mapped_column(Float)
    min_elevation: Mapped[float | None] = mapped_column(Float)
    max_elevation: Mapped[float | None] = mapped_column(Float)

    # Running specific
    average_cadence: Mapped[int | None] = mapped_column(Integer)
    average_running_cadence: Mapped[float | None] = mapped_column(Float)
    max_running_cadence: Mapped[float | None] = mapped_column(Float)
    average_stride_length: Mapped[float | None] = mapped_column(Float)
    vertical_oscillation: Mapped[float | None] = mapped_column(Float)
    ground_contact_time: Mapped[float | None] = mapped_column(Float)
    lap_count: Mapped[int | None] = mapped_column(Integer)
    has_splits: Mapped[bool | None] = mapped_column(Boolean)
    has_intensity_intervals: Mapped[bool | None] = mapped_column(Boolean)
    fastest_split_1000: Mapped[float | None] = mapped_column(Float)
    fastest_split_1609: Mapped[float | None] = mapped_column(Float)

    # Swimming specific
    pool_length: Mapped[float | None] = mapped_column(Float)
    average_swolf: Mapped[float | None] = mapped_column(Float)
    average_swim_cadence: Mapped[float | None] = mapped_column(Float)
    stroke_type: Mapped[str | None] = mapped_column(String(64))
    active_lengths: Mapped[int | None] = mapped_column(Integer)
    strokes: Mapped[float | None] = mapped_column(Float)
    average_strokes: Mapped[float | None] = mapped_column(Float)
    water_estimated: Mapped[float | None] = mapped_column(Float)

    # Location
    start_latitude: Mapped[float | None] = mapped_column(Float)
    start_longitude: Mapped[float | None] = mapped_column(Float)
    end_latitude: Mapped[float | None] = mapped_column(Float)
    end_longitude: Mapped[float | None] = mapped_column(Float)

    # GPS / route
    has_gps: Mapped[bool] = mapped_column(Boolean, default=False)
    polyline: Mapped[str | None] = mapped_column(Text)  # encoded polyline

    # Training metrics
    training_effect: Mapped[float | None] = mapped_column(Float)
    anaerobic_training_effect: Mapped[float | None] = mapped_column(Float)
    vo2_max: Mapped[float | None] = mapped_column(Float)
    lactate_threshold_bpm: Mapped[int | None] = mapped_column(Integer)

    # Raw data
    splits: Mapped[dict | None] = mapped_column(JSON)
    laps: Mapped[dict | None] = mapped_column(JSON)
    raw_data: Mapped[dict | None] = mapped_column(JSON)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_activities_type_start", "activity_type", "start_time"),
    )
