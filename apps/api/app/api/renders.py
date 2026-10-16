"""Render a selected highlight to a branded 9:16 MP4 and serve the result through signed URLs.

POST /highlights/{id}/render → builds + validates the canonical timeline now (bad input fails fast),
reuses an identical finished render (cache keyed by timeline hash) or queues a `render` job.
"""

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core import signing
from app.core.access import get_owned
from app.core.auth import User, current_user
from app.core.config import get_settings
from app.core.db import service_client, transcript_words
from app.services.rendering import timeline

router = APIRouter()
FILES = {"video": "output_path", "thumb": "thumbnail_path"}


class RenderRequest(BaseModel):
    quality: Literal["draft", "looks", "delivery"] = "looks"


@router.post("/highlights/{highlight_id}/render", status_code=202)
def render_highlight(highlight_id: str, body: RenderRequest, user: User = Depends(current_user)) -> dict:
    h = get_owned("highlight_candidates", highlight_id, user, write=True)
    if h["status"] != "selected":
        raise HTTPException(409, "Select this highlight before rendering it")
    db = service_client()
    rec = db.table("source_recordings").select("*").eq("id", h["recording_id"]).single().execute().data
    tr_id = h.get("transcript_id") or (
        db.table("transcripts")
        .select("id")
        .eq("recording_id", rec["id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
        or [{}]
    )[0].get("id")
    words = transcript_words(tr_id) if tr_id else []
    render_id = str(uuid.uuid4())
    doc = timeline.build(h, rec, words, render_id, body.quality)
    digest = timeline.timeline_hash(doc)

    previous = (
        db.table("render_jobs")
        .select("id, job_id, status, output_path")
        .eq("highlight_id", h["id"])
        .eq("timeline_hash", digest)
        .in_("status", ["queued", "rendering", "ready"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if previous:
        p = previous[0]
        if p["status"] != "ready" or (get_settings().data_dir / p["output_path"]).exists():
            return {"render_id": p["id"], "job_id": p["job_id"], "cached": p["status"] == "ready"}

    db.table("render_jobs").insert(
        {
            "id": render_id,
            "organization_id": h["organization_id"],
            "project_id": h["project_id"],
            "recording_id": rec["id"],
            "highlight_id": h["id"],
            "created_by": user.id,
            "quality": body.quality,
            "timeline": doc,
            "timeline_hash": digest,
        }
    ).execute()
    job = (
        db.table("jobs")
        .insert(
            {
                "organization_id": h["organization_id"],
                "project_id": h["project_id"],
                "job_type": "render",
                "payload": {"render_id": render_id},
                "created_by": user.id,
                "current_stage": "queued",
            }
        )
        .execute()
        .data[0]
    )
    db.table("render_jobs").update({"job_id": job["id"]}).eq("id", render_id).execute()
    return {"render_id": render_id, "job_id": job["id"], "cached": False}


@router.get("/renders/{render_id}/urls")
def render_urls(render_id: str, user: User = Depends(current_user)) -> dict:
    r = get_owned("render_jobs", render_id, user)
    if r["status"] != "ready":
        raise HTTPException(409, "This render is not finished")
    out = {}
    for kind in FILES:
        q, exp = signing.query(f"render-{kind}", r["id"])
        out[kind] = f"/renders/{r['id']}/file/{kind}?{q}"
        out["expires_at"] = exp
    out["download"] = out["video"] + "&download=1"
    return out


@router.get("/renders/{render_id}/file/{kind}")
def render_file(
    render_id: str, kind: Literal["video", "thumb"], exp: int, sig: str, download: int = 0
) -> FileResponse:
    if not signing.valid(f"render-{kind}", render_id, exp, sig):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Link expired or invalid")
    rows = service_client().table("render_jobs").select("*").eq("id", render_id).limit(1).execute().data
    rel = rows[0][FILES[kind]] if rows else None
    path = get_settings().data_dir / rel if rel else None
    if not path or not path.is_file():
        raise HTTPException(404, "Not found")
    name = f"reel-{render_id[:8]}.mp4" if download and kind == "video" else None
    return FileResponse(path, filename=name)
