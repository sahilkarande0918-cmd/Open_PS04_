# Handoff

_Last updated: 2026-10-16 — Phases 02/03 verified on synthetic fixtures; Phase 01 production blocked on owner access._

## Where things are
- Repo `C:\dev\Reel-Studio`; venv `%LOCALAPPDATA%\reel-studio\venv` (Python 3.11); data `%LOCALAPPDATA%\reel-studio\data` (models, recordings, test-recordings, caches).
- ASR model: `data/models/hinglish-apex-ct2` (converted Oriserve Hinglish-Apex). `apps/api/.env` sets `WHISPER_MODEL`, `WHISPER_LANGUAGE=hi`.
- LLM: Ollama `qwen2.5vl:7b` (already pulled). OCR: RapidOCR (pip).
- Local Supabase (Docker) has all 3 migrations; `.env` files point at it.
- Run: `python -m app.serve --tunnel none` (API + worker) in `apps/api`; `pnpm dev` at root.

## Production
- Vercel https://reel-studio-taupe.vercel.app: env vars set by owner, landing/login/signup 200, protected routes redirect. Works against the remote Supabase project, which still has **no tables** → onboarding fails there until migrations are applied.
- Remote Supabase `adjwycjsxtxvjockxtan`: CLI account cannot see it.
- Tunnel: Cloudflare blocked (port 7844); Tailscale Funnel supported by the launcher, needs owner install.

## Fixtures (synthetic, not in git)
`data/test-recordings/react-hooks-hinglish.mp4` (+ `-hq` 52 MB, `.reference.json`, `.ocr.json`) and `express-scroll-focus.mp4` built by `tests/fixtures/lecture/build.py` (Windows Ravi en-IN voice + Hyperframes). Real-world Hinglish validation remains unverified (no free licensed download).

## Verified (see TEST_STATUS)
Upload with resume through the UI; GPU ASR 25.8× real time; WER 31.1 % → 28.2 % with screen OCR; timing ±0.27 s; cancel/retry/crash recovery; highlights 2/2 on topic boundaries; reframing cuts at real window switches; highlight UI edits persist.

## Next
Phase 04 (CURRENT_TASK.md). Then 05 topic-to-video, 06 editor, 07 publishing, 08 analytics/SaaS, 09 submission.
