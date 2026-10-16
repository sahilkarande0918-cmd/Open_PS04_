"""Supabase JWT verification for the local processing API.

The token is checked by Supabase Auth itself (`GET /auth/v1/user`). That works for both
legacy HS256 and asymmetric signing-key projects and honours logouts/revocations.
"""

import time
from dataclasses import dataclass

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)
# ponytail: per-process dict cache with 60 s TTL; fine for one local API process.
_cache: dict[str, tuple[float, "User"]] = {}
_TTL = 60.0


@dataclass(frozen=True)
class User:
    id: str
    email: str | None
    token: str


def _verify_with_supabase(token: str, settings: Settings) -> User:
    if not settings.supabase_url:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Auth backend not configured")
    try:
        r = httpx.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": settings.supabase_secret_key},
            timeout=10,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Auth backend unreachable") from e
    if r.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    body = r.json()
    return User(id=body["id"], email=body.get("email"), token=token)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = creds.credentials
    now = time.monotonic()
    hit = _cache.get(token)
    if hit and now - hit[0] < _TTL:
        return hit[1]
    user = _verify_with_supabase(token, settings)
    _cache[token] = (now, user)
    if len(_cache) > 1000:
        _cache.clear()
    return user
