from datetime import UTC, datetime, timedelta

from app.core.config import get_settings
from app.core.db import service_client
from app.services.publishing import instagram, tokens


def instagram_client(account: dict) -> instagram.Instagram:
    db, settings = service_client(), get_settings()
    rows = db.table("social_credentials").select("ciphertext").eq("account_id", account["id"]).execute().data
    if not rows:
        raise RuntimeError("Reconnect Instagram: credentials are missing")
    credentials = tokens.decrypt(rows[0]["ciphertext"], settings.token_encryption_key, account["id"])
    adapter = instagram.Instagram(credentials["access_token"], settings.instagram_api_version)
    expires = (
        datetime.fromisoformat(account["expires_at"].replace("Z", "+00:00"))
        if account.get("expires_at")
        else None
    )
    if expires and expires <= datetime.now(UTC):
        db.table("social_accounts").update({"status": "expired"}).eq("id", account["id"]).execute()
        raise RuntimeError("Instagram authorization expired. Reconnect your account.")
    if expires and expires < datetime.now(UTC) + timedelta(days=7):
        fresh = adapter.refresh()
        credentials.update(fresh)
        db.table("social_credentials").update(
            {
                "ciphertext": tokens.encrypt(credentials, settings.token_encryption_key, account["id"]),
                "updated_at": datetime.now(UTC).isoformat(),
            }
        ).eq("account_id", account["id"]).execute()
        db.table("social_accounts").update(
            {
                "expires_at": (
                    datetime.now(UTC) + timedelta(seconds=int(fresh.get("expires_in", 3600)))
                ).isoformat()
            }
        ).eq("id", account["id"]).execute()
        adapter = instagram.Instagram(credentials["access_token"], settings.instagram_api_version)
    return adapter
