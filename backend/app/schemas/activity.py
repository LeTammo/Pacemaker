from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any


class ActivityBase(BaseModel):
    garmin_id: str
    name: str | None = None
    activity_type: str
    activity_type_key: str | None = None
    start_time: datetime
    start_time_local: datetime | None = None
    timezone: str | None = None
    duration_seconds: float | None = None
    elapsed_duration_seconds: float | None = None
    moving_duration_seconds: float | None = None
    distance_meters: float | None = None
    average_speed: float | None = None
    max_speed: float | None = None
    average_pace_seconds: float | None = None
    average_heart_rate: int | None = None
    max_heart_rate: int | None = None
    calories: int | None = None
    elevation_gain: float | None = None
    elevation_loss: float | None = None
    average_cadence: int | None = None
    average_running_cadence: float | None = None
    max_running_cadence: float | None = None
    average_stride_length: float | None = None
    vertical_oscillation: float | None = None
    ground_contact_time: float | None = None
    lap_count: int | None = None
    has_splits: bool | None = None
    has_intensity_intervals: bool | None = None
    fastest_split_1000: float | None = None
    fastest_split_1609: float | None = None
    pool_length: float | None = None
    average_swolf: float | None = None
    average_swim_cadence: float | None = None
    stroke_type: str | None = None
    active_lengths: int | None = None
    strokes: float | None = None
    average_strokes: float | None = None
    water_estimated: float | None = None
    start_latitude: float | None = None
    start_longitude: float | None = None
    has_gps: bool = False
    training_effect: float | None = None
    anaerobic_training_effect: float | None = None
    vo2_max: float | None = None


class ActivityResponse(ActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    polyline: str | None = None
    splits: Any | None = None
    laps: Any | None = None
    created_at: datetime
    updated_at: datetime
    synced_at: datetime | None = None

    # Computed helpers
    @property
    def pace_per_km(self) -> str | None:
        if self.average_pace_seconds:
            minutes = int(self.average_pace_seconds // 60)
            seconds = int(self.average_pace_seconds % 60)
            return f"{minutes}:{seconds:02d}"
        return None

    @property
    def distance_km(self) -> float | None:
        if self.distance_meters:
            return round(self.distance_meters / 1000, 2)
        return None

    @property
    def duration_formatted(self) -> str | None:
        if self.duration_seconds:
            hours = int(self.duration_seconds // 3600)
            minutes = int((self.duration_seconds % 3600) // 60)
            seconds = int(self.duration_seconds % 60)
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return None


class ActivityListResponse(BaseModel):
    activities: list[ActivityResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class ActivityFilters(BaseModel):
    activity_type: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    search: str | None = None
    page: int = 1
    page_size: int = 20
