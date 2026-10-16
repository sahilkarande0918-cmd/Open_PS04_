"""Server-side authorization for the processing API. The service client bypasses RLS, so every
endpoint resolves the caller's role in the owning organization here before touching data."""

from fastapi import HTTPException, status

from app.core.auth import User
from app.core.db import service_client

WRITE_ROLES = {"owner", "admin", "editor"}


def role_in(org_id: str, user: User) -> str | None:
    rows = (
        service_client()
        .table("organization_members")
        .select("role")
        .eq("organization_id", org_id)
        .eq("user_id", user.id)
        .limit(1)
        .execute()
        .data
    )
    return rows[0]["role"] if rows else None


def require_role(org_id: str, user: User, write: bool = False) -> str:
    role = role_in(org_id, user)
    if role is None or (write and role not in WRITE_ROLES):
        # 404, not 403: do not reveal that another org's resource exists.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return role


def get_owned(table: str, row_id: str, user: User, write: bool = False, columns: str = "*") -> dict:
    rows = service_client().table(table).select(columns).eq("id", row_id).limit(1).execute().data
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    require_role(rows[0]["organization_id"], user, write)
    return rows[0]
