from pydantic import BaseModel, ConfigDict


class ActivitySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    activity_type: str
    split_mode: str
    layout_mode: str
    goal_unit: str
    goal_value: float | None = None


class ActivitySettingsUpdate(BaseModel):
    split_mode: str | None = None
    layout_mode: str | None = None
    goal_unit: str | None = None
    goal_value: float | None = None
