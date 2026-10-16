from urllib.parse import parse_qs, urlparse

import httpx
import pytest


def test_instagram_authorization_uses_instagram_login():
    from app.services.publishing.instagram import authorization_url

    url = authorization_url("123", "https://example.test/callback", "random-state")
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    assert parsed.netloc == "www.instagram.com"
    assert query["state"] == ["random-state"]
    assert "instagram_business_content_publish" in query["scope"][0]
    assert "pages_show_list" not in query["scope"][0]


def test_tokens_authenticated_and_bound_to_account():
    from app.services.publishing.tokens import decrypt, encrypt, new_key

    key = new_key()
    sealed = encrypt({"access_token": "private"}, key, "account-a")
    assert "private" not in sealed
    assert decrypt(sealed, key, "account-a")["access_token"] == "private"
    with pytest.raises(ValueError):
        decrypt(sealed, key, "account-b")


def test_provider_errors_never_expose_request_token():
    from app.services.publishing.instagram import checked

    response = httpx.Response(
        400,
        json={"error": {"message": "token=secret", "code": 190}},
        request=httpx.Request("GET", "https://graph.instagram.com/me?access_token=secret"),
    )
    with pytest.raises(RuntimeError) as err:
        checked(response)
    assert "secret" not in str(err.value)
    assert "190" in str(err.value)


def test_exchange_network_failure_does_not_expose_credentials(monkeypatch):
    from app.services.publishing import instagram

    def fail(*args):
        raise httpx.ConnectError("secret-in-request-url")

    monkeypatch.setattr(instagram, "_exchange", fail)
    with pytest.raises(RuntimeError, match="could not reach Meta") as err:
        instagram.exchange("private-code", object())
    assert "secret" not in str(err.value)
