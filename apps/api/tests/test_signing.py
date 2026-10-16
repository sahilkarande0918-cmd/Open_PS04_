from types import SimpleNamespace

from app.core import signing


def test_api_and_worker_derive_same_media_key(monkeypatch):
    settings = SimpleNamespace(token_encryption_key="private-test-key", supabase_secret_key="")
    monkeypatch.setattr(signing, "get_settings", lambda: settings)
    api_key = signing._shared_key()
    worker_key = signing._shared_key()
    assert api_key == worker_key
    assert api_key != settings.token_encryption_key.encode()
    settings.token_encryption_key = "rotated-test-key"
    assert signing._shared_key() != api_key


def test_media_signature_rejects_different_resource_and_expired_url():
    import time

    expires = int(time.time()) + 60
    signature = signing.sign("render-video", "render-a", expires)
    assert signing.valid("render-video", "render-a", expires, signature)
    assert not signing.valid("render-video", "render-b", expires, signature)
    assert not signing.valid("render-video", "render-a", expires - 120, signature)
