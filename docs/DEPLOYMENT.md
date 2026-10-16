# Deployment

_Verified 2026-10-16 (end of session 1). This file is the single source of truth for deployment state._

## Current state

| Piece | State | Evidence |
|-------|-------|----------|
| Vercel project `reel-studio` (team *sahilkarande0918-9163's projects*, `prj_VVWevgFfCwq7LgQauMu1B11RGzua`) | ✅ Git-connected to `main`, auto-deploys on push | latest production deployment `dpl_8kA8nFpHbdXaxCMX8un2vNi2iu2e` for commit `9a4ee55` = READY |
| Production URL | https://reel-studio-taupe.vercel.app | project domains |
| Public routes | ✅ `/`, `/login`, `/signup`, `/forgot-password` → 200 | curl after owner set env vars and redeployed |
| Protected routes | ✅ `/dashboard`, `/projects`, `/glossary` → 307 `/login?next=…` | curl |
| Vercel env vars (names only) | ✅ set by owner: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` | site no longer 500s (the earlier all-500 state was caused by missing env vars and is resolved). Values cannot be read via the Vercel connector (403); CLI not logged in |
| Secrets in browser bundle | ✅ none | grep of served JS for `sb_secret_` / `service_role` = 0 |
| Remote Supabase `adjwycjsxtxvjockxtan` (Reel-Studio, friend's org) | ⛔ **empty — no migrations applied** | REST probe: `PGRST205 Could not find the table 'public.backend_endpoints'` |
| Consequence on production | ⛔ signup/login can reach Supabase Auth, but onboarding (`create_organization` RPC), dashboard data, projects, uploads, highlights all fail until migrations exist | |
| Supabase CLI access | ⛔ CLI account (owner's personal) lists only "sahilkarande0918@gmail.com's Org"; Reel-Studio is not visible | `supabase orgs list` |
| Email confirmation on remote | ⚠️ ON (`mailer_autoconfirm: false`); built-in SMTP only reaches team addresses at a low rate | `/auth/v1/settings` |
| Auth redirect URLs on remote | ⬜ not verified (dashboard access needed) | |
| Public backend tunnel | ⛔ not running. Cloudflare quick tunnel blocked on owner's network (TCP+UDP 7844); Tailscale Funnel path implemented but owner must install/authorize | `cloudflared` pre-checks |
| Production ↔ backend | ⛔ untested (needs remote DB + tunnel) | |

## Frontend — Vercel Hobby
- Root Directory `apps/web`, framework Next.js, Node 24.x, install `pnpm install`.
- Env vars are inlined at build time → redeploy after changing them.
- Hobby may refuse Git-triggered deploys for commits authored by someone other than the project owner; the owner then redeploys from the dashboard. Never spoof authors.
- Vercel Authentication (standard protection) covers preview URLs; the production domain is public.

## Database/Auth — Supabase Free (owner actions required)
1. Give the CLI access to the friend's org: accept the Developer invitation for the account the CLI uses, then `pnpm exec supabase login` again if a different account. **Or** skip the CLI and run the SQL files manually (step 3).
2. CLI path: `pnpm exec supabase link --project-ref adjwycjsxtxvjockxtan` → `pnpm exec supabase db push --dry-run` → `pnpm exec supabase db push` (asks for the DB password in the terminal; never paste it in chat).
3. Manual path: Reel-Studio → SQL Editor → run in order:
   `supabase/migrations/20261016120000_identity_orgs_jobs.sql`, `20261016140000_recordings_transcripts.sql`, `20261016160000_highlights.sql`.
4. Authentication → URL Configuration: Site URL `https://reel-studio-taupe.vercel.app`; Redirect URLs `https://reel-studio-taupe.vercel.app/**`, `http://localhost:3000/**`. May need the Owner account.
5. For a public demo: Authentication → Providers → Email → disable "Confirm email" (or configure a free SMTP provider).
6. Backend secret: put `SUPABASE_URL=https://adjwycjsxtxvjockxtan.supabase.co` and `SUPABASE_SECRET_KEY` (Project Settings → API Keys → secret) into `apps/api/.env` **only on the processing machine** when switching the backend from the local stack to production.
7. Verify: `pnpm exec supabase test db --linked` is not available for remote; instead re-run the RLS isolation scenarios against remote with two test accounts (see TEST_STATUS Phase 01).

## Local processing backend
```
cd C:\dev\Reel-Studio\apps\api
C:\Users\Sahil\AppData\Local\reel-studio\venv\Scripts\python -m app.serve --tunnel none      # API + worker, local only
C:\Users\Sahil\AppData\Local\reel-studio\venv\Scripts\python -m app.serve --tunnel tailscale # public via Funnel (after owner setup)
C:\Users\Sahil\AppData\Local\reel-studio\venv\Scripts\python -m app.serve                    # Cloudflare quick tunnel (needs TCP 7844)
```
`apps/api/.env` (git-ignored): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ALLOWED_ORIGINS` (must include `https://reel-studio-taupe.vercel.app` for production), `DATA_DIR`, `WHISPER_MODEL`, `WHISPER_LANGUAGE`, `PUBLIC_API_URL` (set automatically by the tunnel launcher).

## Tunnel (free)
- Cloudflare quick tunnel over HTTP/2: implemented in `app/serve.py`; URL changes per start; the API heartbeats it to `backend_endpoints` and the frontend discovers it. **Blocked on the owner's current network** (outbound 7844 TCP/UDP refused).
- Tailscale Funnel: implemented in `app/serve.py --tunnel tailscale` (reads the machine's `*.ts.net` name, runs `tailscale funnel 8000`). **Not yet tested** — owner must install Tailscale, sign in, enable Funnel for the node in the admin console.
- Security on any tunnel: every processing endpoint requires a Supabase session verified by Supabase Auth; org role checked server-side; CORS limited to `ALLOWED_ORIGINS`; media playback via 6-hour HMAC-signed URLs; uploads capped (4 GB, 16 MB chunks, ffprobe-validated).

## Known limitations
- Heavy processing (ASR, OCR, LLM, rendering) only runs while the owner's machine, API, worker and tunnel are up; the UI shows a truthful offline state otherwise.
- Quick-tunnel URLs are ephemeral; Tailscale Funnel gives a stable URL.
