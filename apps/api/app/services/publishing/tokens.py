"""OAuth credentials encrypted at rest with AES-256-GCM, bound to their account ID."""

import base64
import json
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def new_key() -> str:
    return base64.urlsafe_b64encode(os.urandom(32)).decode()


def _key(value: str) -> bytes:
    try:
        raw = base64.urlsafe_b64decode(value)
        if len(raw) != 32:
            raise ValueError()
        return raw
    except Exception as exc:
        raise ValueError("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key") from exc


def encrypt(payload: dict, key: str, account_id: str) -> str:
    nonce = os.urandom(12)
    body = AESGCM(_key(key)).encrypt(nonce, json.dumps(payload).encode(), account_id.encode())
    return base64.urlsafe_b64encode(nonce + body).decode()


def decrypt(payload: str, key: str, account_id: str) -> dict:
    try:
        raw = base64.urlsafe_b64decode(payload)
        return json.loads(AESGCM(_key(key)).decrypt(raw[:12], raw[12:], account_id.encode()))
    except (InvalidTag, ValueError, TypeError) as exc:
        raise ValueError("Stored account credentials could not be decrypted") from exc
