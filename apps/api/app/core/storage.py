"""Local media layout. Paths are built only from server-generated UUIDs, never from user input."""

import uuid
from pathlib import Path

from app.core.config import get_settings


def recording_dir(org_id: str, recording_id: str) -> Path:
    # uuid.UUID() rejects anything that is not a UUID, so no traversal is possible.
    d = (
        get_settings().data_dir
        / "orgs"
        / str(uuid.UUID(org_id))
        / "recordings"
        / str(uuid.UUID(recording_id))
    )
    d.mkdir(parents=True, exist_ok=True)
    return d


def source_path(rec: dict) -> Path:
    return recording_dir(rec["organization_id"], rec["id"]) / f"source{Path(rec['filename']).suffix.lower()}"


def render_dir(org_id: str, render_id: str) -> Path:
    d = get_settings().data_dir / "orgs" / str(uuid.UUID(org_id)) / "renders" / str(uuid.UUID(render_id))
    d.mkdir(parents=True, exist_ok=True)
    return d
