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


def transcript_words(transcript_id: str) -> list[dict]:
    """All words of a transcript in order (PostgREST pages at 1000 rows)."""
    out: list[dict] = []
    for start in range(0, 200_000, 1000):
        page = (
            service_client()
            .table("transcript_words")
            .select("*")
            .eq("transcript_id", transcript_id)
            .order("idx")
            .range(start, start + 999)
            .execute()
            .data
        )
        out += page
        if len(page) < 1000:
            break
    return out
