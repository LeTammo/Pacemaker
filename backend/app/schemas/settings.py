from pydantic import BaseModel, ConfigDict


class ActivitySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    activity_type: str
    split_mode: str
    layout_mode: str


class ActivitySettingsUpdate(BaseModel):
    split_mode: str | None = None
    layout_mode: str | None = None
