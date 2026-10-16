"""Chunked, resumable uploads straight to local disk, plus signed media playback URLs.

Flow: POST /recordings → PUT /recordings/{id}/chunk?offset=N (repeat) → POST /recordings/{id}/complete.
GET /recordings/{id} reports received bytes, so a client resumes from where the disk says it stopped.
"""

import hashlib
import hmac
import secrets
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.access import get_owned
from app.core.auth import User, current_user
from app.core.db import service_client
from app.core.storage import source_path
from app.services import media

router = APIRouter(prefix="/recordings")
CHUNK_MAX = 16 * 1024 * 1024  # stays well under free tunnel request-body limits
_MEDIA_KEY = secrets.token_bytes(
    32
)  # ponytail: per-process key; restart invalidates links, client re-requests
MEDIA_TTL_S = 6 * 3600


class CreateRecording(BaseModel):
    project_id: str
    filename: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0, le=media.MAX_BYTES)


@router.post("", status_code=201)
def create(body: CreateRecording, user: User = Depends(current_user)) -> dict:
    ext = Path(body.filename).suffix.lower()
    if ext not in media.ALLOWED_EXT:
        raise HTTPException(
            422, f"Unsupported file type {ext or '(none)'}. Use {', '.join(sorted(media.ALLOWED_EXT))}."
        )
    project = get_owned("projects", body.project_id, user, write=True, columns="id, organization_id, mode")
    if project["mode"] != "recording":
        raise HTTPException(422, "This project is a Topic → Video project")
    row = (
        service_client()
        .table("source_recordings")
        .insert(
            {
                "organization_id": project["organization_id"],
                "project_id": project["id"],
                "created_by": user.id,
                "filename": Path(body.filename).name,
                "size_bytes": body.size_bytes,
            }
        )
        .execute()
        .data[0]
    )
    source_path(row).touch()
    return {"id": row["id"], "chunk_size": CHUNK_MAX, "received_bytes": 0}


@router.get("/{rec_id}")
def status_of(rec_id: str, user: User = Depends(current_user)) -> dict:
    rec = get_owned("source_recordings", rec_id, user)
    p = source_path(rec)
    return {
        "id": rec["id"],
        "status": rec["status"],
        "size_bytes": rec["size_bytes"],
        "received_bytes": p.stat().st_size if p.exists() else 0,
    }


@router.put("/{rec_id}/chunk")
async def put_chunk(
    rec_id: str, request: Request, offset: int = Query(ge=0), user: User = Depends(current_user)
) -> dict:
    rec = get_owned("source_recordings", rec_id, user, write=True)
    if rec["status"] != "uploading":
        raise HTTPException(409, "Upload already completed")
    p = source_path(rec)
    have = p.stat().st_size if p.exists() else 0
    if offset != have:
        # Client is out of sync (retry after a dropped connection): tell it where to resume.
        raise HTTPException(409, detail={"message": "offset mismatch", "received_bytes": have})
    data = await request.body()
    if not data or len(data) > CHUNK_MAX:
        raise HTTPException(413, f"Chunk must be 1..{CHUNK_MAX} bytes")
    if have + len(data) > rec["size_bytes"]:
        raise HTTPException(413, "Chunk exceeds declared file size")
    with p.open("ab") as f:
        f.write(data)
    received = have + len(data)
    service_client().table("source_recordings").update({"received_bytes": received}).eq(
        "id", rec_id
    ).execute()
    return {"received_bytes": received}


@router.post("/{rec_id}/complete")
def complete(rec_id: str, user: User = Depends(current_user)) -> dict:
    rec = get_owned("source_recordings", rec_id, user, write=True)
    if rec["status"] != "uploading":
        raise HTTPException(409, "Upload already completed")
    p = source_path(rec)
    if p.stat().st_size != rec["size_bytes"]:
        raise HTTPException(409, detail={"message": "upload incomplete", "received_bytes": p.stat().st_size})
    db = service_client()
    try:
        info = media.probe(p)
        summary = media.summarize(info)
    except media.MediaError as e:
        db.table("source_recordings").update({"status": "failed", "error": str(e)}).eq("id", rec_id).execute()
        p.unlink(missing_ok=True)  # invalid uploads are not kept
        raise HTTPException(422, str(e)) from e
    db.table("source_recordings").update(
        {
            **summary,
            "status": "uploaded",
            "storage_path": str(p.relative_to(p.parents[4])),
            "probe": info["format"],
        }
    ).eq("id", rec_id).execute()
    job = (
        db.table("jobs")
        .insert(
            {
                "organization_id": rec["organization_id"],
                "project_id": rec["project_id"],
                "job_type": "transcribe",
                "payload": {"recording_id": rec_id},
                "idempotency_key": f"transcribe:{rec_id}",
                "created_by": user.id,
                "current_stage": "queued",
            }
        )
        .execute()
        .data[0]
    )
    return {"recording": {**rec, **summary, "status": "uploaded"}, "job_id": job["id"]}


@router.post("/{rec_id}/transcribe")
def retranscribe(rec_id: str, user: User = Depends(current_user)) -> dict:
    """Retry / re-run transcription (e.g. after a failure or glossary change)."""
    rec = get_owned("source_recordings", rec_id, user, write=True)
    if rec["status"] in ("uploading",):
        raise HTTPException(409, "Upload not finished")
    db = service_client()
    active = (
        db.table("jobs")
        .select("id")
        .eq("job_type", "transcribe")
        .contains("payload", {"recording_id": rec_id})
        .in_("status", ["queued", "running"])
        .execute()
        .data
    )
    if active:
        return {"job_id": active[0]["id"]}
    job = (
        db.table("jobs")
        .insert(
            {
                "organization_id": rec["organization_id"],
                "project_id": rec["project_id"],
                "job_type": "transcribe",
                "payload": {"recording_id": rec_id},
                "created_by": user.id,
                "current_stage": "queued",
            }
        )
        .execute()
        .data[0]
    )
    return {"job_id": job["id"]}


def _sign(rec_id: str, exp: int) -> str:
    return hmac.new(_MEDIA_KEY, f"{rec_id}:{exp}".encode(), hashlib.sha256).hexdigest()


@router.get("/{rec_id}/media-url")
def media_url(rec_id: str, request: Request, user: User = Depends(current_user)) -> dict:
    rec = get_owned("source_recordings", rec_id, user)
    exp = int(time.time()) + MEDIA_TTL_S
    return {"path": f"/recordings/{rec['id']}/media?exp={exp}&sig={_sign(rec['id'], exp)}", "expires_at": exp}


@router.get("/{rec_id}/media")
def media_file(rec_id: str, exp: int, sig: str) -> FileResponse:
    """<video> cannot send an Authorization header, so playback uses a short-lived HMAC-signed URL."""
    if exp < time.time() or not hmac.compare_digest(sig, _sign(rec_id, exp)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Link expired or invalid")
    rows = service_client().table("source_recordings").select("*").eq("id", rec_id).limit(1).execute().data
    if not rows or rows[0]["status"] == "uploading":
        raise HTTPException(404, "Not found")
    return FileResponse(source_path(rows[0]))  # Starlette FileResponse serves HTTP Range requests
