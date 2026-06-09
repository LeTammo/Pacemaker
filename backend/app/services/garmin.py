"""
Garmin Connect integration layer.
Handles authentication, token persistence, and data fetching.
"""

import os
import json
import asyncio
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Any

import garminconnect
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.core.logging import logger


class GarminService:
    def __init__(self):
        self._client: garminconnect.Garmin | None = None
        self._token_store = Path(settings.garmin_token_store)
        self._token_store.mkdir(parents=True, exist_ok=True)

    def _get_token_path(self) -> Path:
        return self._token_store / "tokens.json"

    def _save_tokens(self, client: garminconnect.Garmin) -> None:
        token_path = self._get_token_path()
        try:
            # garminconnect stores tokens internally; we persist the pickle/json
            tokenstore = client.garth.dumps()
            token_path.write_text(tokenstore)
            logger.info("Garmin tokens saved", path=str(token_path))
        except Exception as e:
            logger.warning("Could not save tokens", error=str(e))

    async def _get_client(self) -> garminconnect.Garmin:
        if self._client is not None:
            return self._client

        token_path = self._get_token_path()
        client = garminconnect.Garmin()

        if token_path.exists():
            try:
                logger.info("Loading existing Garmin tokens")
                tokenstore = token_path.read_text()
                await asyncio.get_event_loop().run_in_executor(
                    None, lambda: client.garth.loads(tokenstore)
                )
                await asyncio.get_event_loop().run_in_executor(
                    None, client.login
                )
                self._client = client
                logger.info("Garmin authenticated via stored tokens")
                return self._client
            except Exception as e:
                logger.warning("Stored tokens invalid, re-authenticating", error=str(e))

        # Fresh login
        logger.info("Authenticating with Garmin Connect")
        client = garminconnect.Garmin(
            settings.garmin_email,
            settings.garmin_password,
        )
        await asyncio.get_event_loop().run_in_executor(None, client.login)
        self._save_tokens(client)
        self._client = client
        logger.info("Garmin authentication successful")
        return self._client

    def invalidate_client(self) -> None:
        """Force re-authentication on next call."""
        self._client = None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(Exception),
    )
    async def _call(self, method: str, *args, **kwargs) -> Any:
        client = await self._get_client()
        try:
            fn = getattr(client, method)
            result = await asyncio.get_event_loop().run_in_executor(
                None, lambda: fn(*args, **kwargs)
            )
            return result
        except garminconnect.GarminConnectAuthenticationError:
            logger.warning("Auth error, invalidating client and retrying")
            self.invalidate_client()
            raise
        except Exception as e:
            logger.error("Garmin API call failed", method=method, error=str(e))
            raise

    async def get_activities(
        self,
        start: int = 0,
        limit: int = 100,
        activity_type: str | None = None,
    ) -> list[dict]:
        """Fetch activities from Garmin Connect."""
        logger.info("Fetching activities", start=start, limit=limit)
        activities = await self._call("get_activities", start, limit)
        if activity_type:
            activities = [a for a in activities if a.get("activityType", {}).get("typeKey") == activity_type]
        return activities or []

    async def get_activity_details(self, activity_id: str) -> dict:
        """Fetch detailed activity data including splits and laps."""
        logger.info("Fetching activity details", activity_id=activity_id)
        return await self._call("get_activity_details", activity_id) or {}

    async def get_activity_hr_timeseries(self, activity_id: str) -> dict:
        return await self._call("get_activity_hr_timeseries", activity_id) or {}

    async def get_activity_weather(self, activity_id: str) -> dict:
        try:
            return await self._call("get_activity_weather", activity_id) or {}
        except Exception:
            return {}

    async def get_daily_stats(self, target_date: date) -> dict:
        date_str = target_date.isoformat()
        logger.info("Fetching daily stats", date=date_str)
        try:
            return await self._call("get_stats", date_str) or {}
        except Exception as e:
            logger.warning("Could not fetch daily stats", date=date_str, error=str(e))
            return {}

    async def get_heart_rates(self, target_date: date) -> dict:
        date_str = target_date.isoformat()
        try:
            return await self._call("get_heart_rates", date_str) or {}
        except Exception:
            return {}

    async def get_sleep_data(self, target_date: date) -> dict:
        date_str = target_date.isoformat()
        logger.info("Fetching sleep data", date=date_str)
        try:
            return await self._call("get_sleep_data", date_str) or {}
        except Exception as e:
            logger.warning("Could not fetch sleep data", date=date_str, error=str(e))
            return {}

    async def get_body_battery(self, start_date: date, end_date: date) -> list:
        try:
            return await self._call(
                "get_body_battery",
                start_date.isoformat(),
                end_date.isoformat(),
            ) or []
        except Exception:
            return []

    async def get_hrv_data(self, target_date: date) -> dict:
        date_str = target_date.isoformat()
        try:
            return await self._call("get_hrv_data", date_str) or {}
        except Exception:
            return {}

    async def get_training_readiness(self, target_date: date) -> dict:
        try:
            return await self._call("get_training_readiness", target_date.isoformat()) or {}
        except Exception:
            return {}

    async def get_training_status(self, target_date: date) -> dict:
        try:
            return await self._call("get_training_status", target_date.isoformat()) or {}
        except Exception:
            return {}

    async def get_activities_by_date(
        self, start_date: date, end_date: date
    ) -> list[dict]:
        """Fetch all activities between two dates."""
        logger.info("Fetching activities by date", start=str(start_date), end=str(end_date))
        try:
            return await self._call(
                "get_activities_by_date",
                start_date.isoformat(),
                end_date.isoformat(),
            ) or []
        except Exception as e:
            logger.error("Failed to fetch activities by date", error=str(e))
            return []


garmin_service = GarminService()