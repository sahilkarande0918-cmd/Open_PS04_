"""Publishes this backend's public URL to Supabase so the Vercel frontend can find it (DECISIONS D-004)."""

import asyncio
import logging
import shutil
from datetime import UTC, datetime

from app.core.config import get_settings
from app.core.db import service_client

log = logging.getLogger(__name__)
INTERVAL_S = 30


def beat() -> None:
    s = get_settings()
    service_client().table("backend_endpoints").upsert(
        {
            "id": "primary",
            "url": s.public_api_url,
            "version": "0.1.0",
            "capabilities": {"ffmpeg": shutil.which("ffmpeg") is not None},
            "last_seen_at": datetime.now(UTC).isoformat(),
        }
    ).execute()


async def run_forever() -> None:
    while True:
        try:
            await asyncio.to_thread(beat)
        except Exception as e:  # keep beating; a transient network error must not kill the API
            log.warning("heartbeat failed: %s", e)
        await asyncio.sleep(INTERVAL_S)
