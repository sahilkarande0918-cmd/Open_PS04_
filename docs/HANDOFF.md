# Handoff

_Last updated: 2026-10-16, Phase 01 (code complete locally, deployment blocked on owner logins)._

## Verified state
- `main` pushed. Commits: docs foundation → monorepo init → API service → landing → DB schema → auth/app shell.
- Local dev: `pnpm exec supabase start -x vector,logflare,imgproxy,edge-runtime` (Docker), web `pnpm dev`, API `uvicorn app.main:app --app-dir apps/api --port 8000` using venv `%LOCALAPPDATA%/reel-studio/venv`.
- `apps/web/.env.local` and `apps/api/.env` point at the **local** stack (default local keys). Not committed.
- Test user on local stack only (created through the UI); local data is disposable (`supabase db reset`).
- Teammate invitations still pending acceptance.

## Unfinished
- Remote Supabase link + migration push; Vercel deploy; Auth redirect URLs; tunnel (cloudflared).
- Phase 02 onwards.

## Last successful tests
pytest 5/5 · pgTAP 16/16 · `supabase db lint` clean · `next build` OK · taste inspector 0 FAIL · manual browser: signup → onboarding → dashboard → create project → backend online/offline.

## Environment dependencies
See `docs/ENVIRONMENT.md`. Docker Desktop must be running for the local Supabase stack.

## Important decisions
D-001…D-014 in `docs/DECISIONS.md`.

## Next implementation actions
1. Owner logins → remote Supabase + Vercel (see CURRENT_TASK).
2. Phase 02: `packages/timeline-schema`; chunked upload endpoint; ffprobe validation; worker loop (`claim_next_job`); audio extraction; faster-whisper (verify RTX 5050 / sm_120 support); glossary correction; transcript editor UI.
