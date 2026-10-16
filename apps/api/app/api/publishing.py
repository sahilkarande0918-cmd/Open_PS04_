from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.core.access import get_owned, require_role
from app.core.auth import User, current_user
from app.core.db import service_client

router = APIRouter()


class PublishBody(BaseModel):
    render_id: UUID
    account_id: UUID
    caption: str = Field(default="", max_length=2200)
    scheduled_at: datetime | None = None

    @field_validator("scheduled_at")
    @classmethod
    def timezone_required(cls, value):
        if value and value.tzinfo is None:
            raise ValueError("Schedule must include a timezone")
        return value


@router.get("/publishing")
def queue(organization_id: UUID, user: User = Depends(current_user)) -> list:
    require_role(str(organization_id), user)
    return (
        service_client()
        .table("publish_jobs")
        .select("*")
        .eq("organization_id", str(organization_id))
        .order("scheduled_at", desc=True)
        .limit(100)
        .execute()
        .data
    )


@router.get("/publishing/exports")
def exports(organization_id: UUID, user: User = Depends(current_user)) -> list:
    require_role(str(organization_id), user)
    rows = (
        service_client()
        .table("render_jobs")
        .select("id,duration_s,created_at,timeline,projects(name)")
        .eq("organization_id", str(organization_id))
        .eq("status", "ready")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
        .data
    )
    return [
        {
            "id": r["id"],
            "duration_s": r["duration_s"],
            "created_at": r["created_at"],
            "title": r["timeline"].get("title", "Reel"),
            "project_name": (r.get("projects") or {}).get("name", "Project"),
        }
        for r in rows
    ]


@router.post("/publishing", status_code=202)
def schedule(body: PublishBody, user: User = Depends(current_user)) -> dict:
    render = get_owned("render_jobs", str(body.render_id), user, write=True)
    account = get_owned("social_accounts", str(body.account_id), user, write=True)
    if account["organization_id"] != render["organization_id"]:
        raise HTTPException(404, "Not found")
    if render["status"] != "ready" or account["status"] != "connected":
        raise HTTPException(409, "Choose a finished export and connected account")
    if account["platform"] != "instagram":
        raise HTTPException(409, "YouTube publishing is not configured yet")
    when = body.scheduled_at or datetime.now(UTC)
    if body.scheduled_at and when < datetime.now(UTC):
        raise HTTPException(422, "Choose a future schedule time")
    return (
        service_client()
        .rpc(
            "enqueue_publication",
            {
                "p_render": str(body.render_id),
                "p_account": str(body.account_id),
                "p_user": user.id,
                "p_caption": body.caption,
                "p_when": when.astimezone(UTC).isoformat(),
            },
        )
        .execute()
        .data
    )


@router.post("/publishing/{publish_id}/cancel")
def cancel(publish_id: UUID, user: User = Depends(current_user)) -> dict:
    get_owned("publish_jobs", str(publish_id), user, write=True)
    result = (
        service_client()
        .rpc("change_publication", {"p_id": str(publish_id), "p_action": "cancel", "p_user": user.id})
        .execute()
        .data
    )
    if not result:
        raise HTTPException(409, "Only queued posts can be cancelled")
    return result


@router.post("/publishing/{publish_id}/retry", status_code=202)
def retry(publish_id: UUID, user: User = Depends(current_user)) -> dict:
    get_owned("publish_jobs", str(publish_id), user, write=True)
    result = (
        service_client()
        .rpc("change_publication", {"p_id": str(publish_id), "p_action": "retry", "p_user": user.id})
        .execute()
        .data
    )
    if not result:
        raise HTTPException(409, "This post cannot safely be retried. Check its platform status first.")
    return result
