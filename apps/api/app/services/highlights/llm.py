"""Local LLM judgment of highlight candidates via Ollama (no paid API)."""

import json
import logging

import httpx

from app.core.config import get_settings

log = logging.getLogger(__name__)

SCHEMA = {
    "type": "object",
    "properties": {
        "standalone": {"type": "number", "description": "0-1: understandable without the rest of the class"},
        "complete_start": {"type": "boolean", "description": "starts at the beginning of a thought"},
        "complete_end": {"type": "boolean", "description": "ends after the thought is concluded"},
        "educational": {"type": "number", "description": "0-1: teaches something useful"},
        "title": {
            "type": "string",
            "description": "short reel title, max 8 words, same language mix as the speaker",
        },
        "summary": {"type": "string", "description": "one sentence summary in English"},
        "reason": {"type": "string", "description": "one sentence on why this works or not as a reel"},
    },
    "required": ["standalone", "complete_start", "complete_end", "educational", "title", "summary", "reason"],
}

PROMPT = """You review excerpts from a recorded programming class (Hinglish: Hindi and English mixed,
Roman script) to decide whether each excerpt works as a standalone 30-60 second educational reel.
Judge only from the excerpt text. Do not invent content that is not in it.

Excerpt ({duration:.0f} s):
\"\"\"{text}\"\"\"

Return JSON only."""


def judge(text: str, duration_s: float, model: str | None = None, keep_alive: str = "5m") -> dict | None:
    s = get_settings()
    try:
        r = httpx.post(
            f"{s.ollama_url}/api/chat",
            json={
                "model": model or s.ollama_model,
                "messages": [{"role": "user", "content": PROMPT.format(text=text, duration=duration_s)}],
                "format": SCHEMA,
                "stream": False,
                "keep_alive": keep_alive,
                "options": {"temperature": 0, "seed": 7, "num_ctx": 4096},
            },
            timeout=180,
        )
        r.raise_for_status()
        data = json.loads(r.json()["message"]["content"])
        for k in ("standalone", "educational"):
            data[k] = max(0.0, min(1.0, float(data.get(k, 0))))
        return data
    except (httpx.HTTPError, KeyError, ValueError, json.JSONDecodeError) as e:
        log.warning("LLM judge unavailable: %s", e)
        return None


def unload(model: str | None = None) -> None:
    """Free VRAM before the next GPU stage."""
    s = get_settings()
    try:
        httpx.post(
            f"{s.ollama_url}/api/generate",
            json={"model": model or s.ollama_model, "keep_alive": 0},
            timeout=30,
        )
    except httpx.HTTPError:
        pass
