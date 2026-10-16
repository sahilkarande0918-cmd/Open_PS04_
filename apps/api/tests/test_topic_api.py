"""Generation is authenticated, validated, and queued rather than run in an HTTP request."""

from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def test_generation_endpoints_require_auth():
    client = TestClient(app)
    project = str(uuid4())
    assert client.post(f"/projects/{project}/generate", json={"topic": "JSON vs XML"}).status_code == 401
    assert client.get(f"/projects/{project}/generations").status_code == 401


def test_generate_rejects_recording_projects(monkeypatch):
    from app.api import topics
    from app.core.auth import User, current_user

    app.dependency_overrides[current_user] = lambda: User(id=str(uuid4()), email="a@test.local", token="x")
    monkeypatch.setattr(topics, "get_owned", lambda *a, **k: {"mode": "recording"})
    try:
        result = TestClient(app).post(f"/projects/{uuid4()}/generate", json={"topic": "JSON vs XML"})
        assert result.status_code == 409
    finally:
        app.dependency_overrides.clear()
