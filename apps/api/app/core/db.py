from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def service_client() -> Client:
    """Supabase client with the secret key. Backend only; bypasses RLS, so callers must check ownership."""
    s = get_settings()
    if not s.supabase_configured:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SECRET_KEY not configured")
    return create_client(s.supabase_url, s.supabase_secret_key)
