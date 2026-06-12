from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path


class Settings(BaseSettings):
    # App
    app_name: str = "Garmin Dashboard"
    debug: bool = False
    log_level: str = "INFO"
    admin_password: str = Field("admin", env="ADMIN_PASSWORD")

    # Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    enable_auto_sync: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/garmin.db"
    database_echo: bool = False

    # Garmin
    garmin_email: str = Field(..., env="GARMIN_EMAIL")
    garmin_password: str = Field(..., env="GARMIN_PASSWORD")
    garmin_token_store: str = "./data/garmin_tokens"
    sync_pin: str = Field(..., env="SYNC_PIN")

    # Sync
    sync_interval_hours: int = 4
    sync_initial_days: int = 365  # Days to fetch on first sync
    sync_incremental_days: int = 7  # Days to re-check on incremental sync

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # API
    api_prefix: str = "/api"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
