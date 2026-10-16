"""Upload API against the real local stack (Supabase in Docker + API on :8000).

Run: RS_INTEGRATION=1 pytest tests/test_upload_integration.py
Needs: `supabase start`, the API running, tests/fixtures/synthetic-lesson.mp4 (make-synthetic.ps1),
and the local test users from docs/TEST_STATUS.md.
"""

import os
import uuid
from pathlib import Path

import httpx
import pytest

pytestmark = pytest.mark.skipif(os.environ.get("RS_INTEGRATION") != "1", reason="integration only")

API = os.environ.get("RS_API", "http://127.0.0.1:8000")
SB = "http://127.0.0.1:54321"
FIXTURE = Path(__file__).parents[3] / "tests" / "fixtures" / "synthetic-lesson.mp4"
PASSWORD = "local-test-Pass-2026"


def _pk() -> str:
    env = Path(__file__).parents[2] / "web" / ".env.local"
    return next(
        line.split("=", 1)[1].strip()
        for line in env.read_text().splitlines()
        if line.startswith("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    )


def _token(email: str) -> str:
    pk = _pk()
    r = httpx.post(
        f"{SB}/auth/v1/token?grant_type=password",
        headers={"apikey": pk},
        json={"email": email, "password": PASSWORD},
    )
    if r.status_code != 200:  # create the user on the local stack
        httpx.post(
            f"{SB}/auth/v1/signup", headers={"apikey": pk}, json={"email": email, "password": PASSWORD}
        )
        r = httpx.post(
            f"{SB}/auth/v1/token?grant_type=password",
            headers={"apikey": pk},
            json={"email": email, "password": PASSWORD},
        )
    return r.json()["access_token"]


def _rest(token: str, method: str, path: str, **kw):
    return httpx.request(
        method,
        f"{SB}/rest/v1/{path}",
        headers={"apikey": _pk(), "Authorization": f"Bearer {token}", "Prefer": "return=representation"},
        **kw,
    )


@pytest.fixture(scope="module")
def owner():
    t = _token("upload-owner@test.local")
    h = {"Authorization": f"Bearer {t}"}
    slug = f"up-{uuid.uuid4().hex[:8]}"
    org = _rest(
        t, "POST", "rpc/create_organization", json={"org_name": "Upload Test", "org_slug": slug}
    ).json()
    me = httpx.get(f"{API}/me", headers=h).json()
    proj = _rest(
        t,
        "POST",
        "projects",
        json={
            "organization_id": org["id"],
            "name": "upload test",
            "mode": "recording",
            "created_by": me["id"],
        },
    ).json()[0]
    return h, proj


def test_chunked_resumable_upload_validates_and_queues_job(owner):
    h, proj = owner
    data = FIXTURE.read_bytes()
    r = httpx.post(
        f"{API}/recordings",
        headers=h,
        json={"project_id": proj["id"], "filename": FIXTURE.name, "size_bytes": len(data)},
    )
    assert r.status_code == 201
    rid = r.json()["id"]
    chunk = 200_000
    off = 0
    while off < len(data):
        r = httpx.put(
            f"{API}/recordings/{rid}/chunk",
            params={"offset": off},
            headers=h,
            content=data[off : off + chunk],
        )
        assert r.status_code == 200
        off = r.json()["received_bytes"]
        if off == chunk:  # simulate a client that lost its position: server says where to resume
            stale = httpx.put(
                f"{API}/recordings/{rid}/chunk", params={"offset": 0}, headers=h, content=data[:chunk]
            )
            assert stale.status_code == 409 and stale.json()["detail"]["received_bytes"] == chunk
    assert httpx.get(f"{API}/recordings/{rid}", headers=h).json()["received_bytes"] == len(data)
    done = httpx.post(f"{API}/recordings/{rid}/complete", headers=h, timeout=60)
    assert done.status_code == 200, done.text
    body = done.json()
    assert body["recording"]["width"] == 1920 and body["recording"]["duration_s"] > 20
    assert body["job_id"]


def test_incomplete_upload_cannot_complete(owner):
    h, proj = owner
    r = httpx.post(
        f"{API}/recordings",
        headers=h,
        json={"project_id": proj["id"], "filename": "a.mp4", "size_bytes": 1000},
    )
    rid = r.json()["id"]
    httpx.put(f"{API}/recordings/{rid}/chunk", params={"offset": 0}, headers=h, content=b"x" * 10)
    assert httpx.post(f"{API}/recordings/{rid}/complete", headers=h).status_code == 409


def test_fake_video_rejected_by_ffprobe(owner):
    h, proj = owner
    junk = b"this is not a video" * 10
    rid = httpx.post(
        f"{API}/recordings",
        headers=h,
        json={"project_id": proj["id"], "filename": "fake.mp4", "size_bytes": len(junk)},
    ).json()["id"]
    httpx.put(f"{API}/recordings/{rid}/chunk", params={"offset": 0}, headers=h, content=junk)
    r = httpx.post(f"{API}/recordings/{rid}/complete", headers=h)
    assert r.status_code == 422 and "media" in r.json()["detail"].lower()


def test_rejects_bad_extension_oversize_and_overflow(owner):
    h, proj = owner
    assert (
        httpx.post(
            f"{API}/recordings",
            headers=h,
            json={"project_id": proj["id"], "filename": "x.exe", "size_bytes": 10},
        ).status_code
        == 422
    )
    assert (
        httpx.post(
            f"{API}/recordings",
            headers=h,
            json={"project_id": proj["id"], "filename": "x.mp4", "size_bytes": 5 * 1024**3},
        ).status_code
        == 422
    )
    rid = httpx.post(
        f"{API}/recordings", headers=h, json={"project_id": proj["id"], "filename": "x.mp4", "size_bytes": 5}
    ).json()["id"]
    assert (
        httpx.put(
            f"{API}/recordings/{rid}/chunk", params={"offset": 0}, headers=h, content=b"123456"
        ).status_code
        == 413
    )


def test_other_org_cannot_touch_project_or_recording(owner):
    h, proj = owner
    rid = httpx.post(
        f"{API}/recordings",
        headers=h,
        json={"project_id": proj["id"], "filename": "b.mp4", "size_bytes": 100},
    ).json()["id"]
    intruder = {"Authorization": f"Bearer {_token('upload-intruder@test.local')}"}
    assert (
        httpx.post(
            f"{API}/recordings",
            headers=intruder,
            json={"project_id": proj["id"], "filename": "c.mp4", "size_bytes": 100},
        ).status_code
        == 404
    )
    assert httpx.get(f"{API}/recordings/{rid}", headers=intruder).status_code == 404
    assert (
        httpx.put(
            f"{API}/recordings/{rid}/chunk", params={"offset": 0}, headers=intruder, content=b"x"
        ).status_code
        == 404
    )
    assert httpx.get(f"{API}/recordings/{rid}/media-url", headers=intruder).status_code == 404


def test_media_url_is_signed(owner):
    h, _ = owner
    assert (
        httpx.get(
            f"{API}/recordings/{uuid.uuid4()}/media", params={"exp": 9999999999, "sig": "x"}
        ).status_code
        == 403
    )
