from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import List, Dict, Any

class SleepListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    calendar_date: date
    sleep_time_seconds: int | None
    sleep_score: int | None
    sleep_score_feedback: str | None
    average_hrv: float | None
    average_resting_heart_rate: int | None
    sleep_heart_rate: List[Dict[str, Any]] | None = None
    sleep_stress: List[Dict[str, Any]] | None = None

class SleepListResponse(BaseModel):
    sleep_records: List[SleepListItem]
    total: int
    page: int
    page_size: int
    has_more: bool

class SleepDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    calendar_date: date
    sleep_time_seconds: int | None
    nap_time_seconds: int | None
    awake_time_seconds: int | None
    deep_sleep_seconds: int | None
    light_sleep_seconds: int | None
    rem_sleep_seconds: int | None
    unmeasurable_sleep_seconds: int | None
    sleep_start: datetime | None
    sleep_end: datetime | None
    sleep_score: int | None
    sleep_score_feedback: str | None
    sleep_score_insight: str | None
    average_hrv: float | None
    average_resting_heart_rate: int | None
    average_sp_o2: float | None
    raw_data: Dict[str, Any] | None
