# Deployment

_Verified 2026-10-17 (session 2, after the owner's first push). This file is the single source of truth for deployment state._

## Current state
| Piece | State | Evidence |
|-------|-------|----------|
| Vercel project `reel-studio` (`prj_VVWevgFfCwq7LgQauMu1B11RGzua`) | ✅ Git-connected to `main`, auto-deploys on push | session 1: `dpl_8kA8nFpH…` READY |
| Production URL | https://reel-studio-taupe.vercel.app | |
| Public routes | ✅ `/`, `/login`, `/signup` → 200 | curl, session 2 |
| Protected routes | ✅ `/dashboard`, `/projects` → 307 `/login?next=…` | curl, session 2 |
| Vercel env vars | ✅ set by owner (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`) | values not readable by the assistant |
| Supabase CLI link | ✅ `adjwycjsxtxvjockxtan` (project "reel.studio'org", org `yqdlgjynocbxxsmzeesy`) | `supabase/.temp/project-ref` |
| Remote migrations | ✅ **6/6 applied** (owner pushes 2026-10-17) | `supabase migration list --linked` |
| Remote schema | ✅ 15 tables, RLS enabled on all 15 | `supabase db dump --linked --schema public,private` (read-only) |
| Remote grants (anon/authenticated) | ✅ fixed: `anon` 0 table grants; `authenticated` 24 explicit grants, none with TRUNCATE (the earlier anon-TRUNCATE hole on 6 tables is closed) | dump after the push |
| Remote grants (service_role) | ✅ DML on all tables + EXECUTE on `claim_next_job` / `requeue_stale_jobs` (`20261017000000`); the project uses Supabase's secure-by-default privileges | backend reads/writes; RPC calls succeed; no worker poll failures after 00:16:42 |
| Remote Auth URL config / email confirmation | ⬜ not verified (needs dashboard) | |
| Public backend tunnel | ✅ Microsoft Dev Tunnels, stable URL `https://j96sqlp6-8000.inc1.devtunnels.ms` | external probes 200; `backend-probe` workflow passed |
| Backend data source | ✅ production: `apps/api/.env` → `https://adjwycjsxtxvjockxtan.supabase.co`; `app.serve --tunnel devtunnel` running | `/health` 200 |
| Production heartbeat | ✅ `backend_endpoints.primary` = `https://j96sqlp6-8000.inc1.devtunnels.ms`, refreshed every few seconds | service-client read (age 7 s) |
| Tunnel against the production backend | ✅ external `/health` 200 (DE, KZ, RU); `backend-probe` run 38950101996 all steps green | check-host.net; GitHub Actions |
| Production Auth | ✅ signup enabled · ⚠️ email confirmation ON (`mailer_autoconfirm: false`): the built-in mailer reaches only members of the Supabase org | `GET /auth/v1/settings` |
| Production signup → confirm → onboarding | ✅ (owner, 2026-10-17): 1 confirmed user, profile from trigger, workspace "Sahil Karande" with owner membership and `organization.created` audit event | service-client read (emails masked) |
| Production project / upload / second-account RLS | ⬜ owner: create a project, refresh, upload a clip; RLS check needs a second account | |
| Vercel `NEXT_PUBLIC_SUPABASE_URL` value | ✅ corrected by owner to `https://adjwycjsxtxvjockxtan.supabase.co` (was the REST endpoint (`…supabase.co/rest/v1/`), so signup failed with "Invalid path specified in request URL" (PostgREST PGRST125, reproduced) | owner screenshot 2026-10-17; fixed in code by `lib/supabase/env.ts` (origin only); owner should still set it to `https://adjwycjsxtxvjockxtan.supabase.co` |
| Production ↔ backend with a real session | ⬜ owner E2E (step 5): needs a signed-in user, which the assistant may not create on a non-local site | |

## Owner actions, in order
1. **Apply migrations** (terminal, from `C:\dev\Reel-Studio`; the DB password is asked for in the terminal, never in chat):
   ```
   pnpm exec supabase db push --linked
   ```
   Always run it from `C:\dev\Reel-Studio`; the OneDrive folder `Reel Studio` is a stale copy. Next pending: `20261017000000_service_role_rpcs` (backend DML + worker RPC grants). Confirm with `pnpm exec supabase migration list --linked`, where every row needs a remote timestamp.
2. **Auth → URL Configuration** (Reel-Studio dashboard; may need the Owner account): Site URL `https://reel-studio-taupe.vercel.app`; Redirect URLs `https://reel-studio-taupe.vercel.app/**` and `http://localhost:3000/**`.
3. **Email confirmation** (decision for the owner): with confirmation on, Supabase's built-in mailer only delivers to the project team's addresses at a low hourly rate, so judges cannot sign up. The options:
   - (a) Keep it on and demo with team accounts.
   - (b) Add free SMTP (e.g. Brevo or Resend free tier) so confirmations reach anyone.
   - (c) Turn "Confirm email" off for the demo. Anyone can then register any address without proving they own it (spam accounts, typo'd emails, no recovery guarantee), but RLS still isolates every account's data.

   Recommended: (b) if time allows, else (c) for the judging window only.
4. **Switch the backend to production**: in `C:\dev\Reel-Studio\apps\api\.env` (git-ignored, this machine only; save the file) set `SUPABASE_URL=https://adjwycjsxtxvjockxtan.supabase.co` and `SUPABASE_SECRET_KEY=` the Reel-Studio **secret** key (Project Settings → API Keys). Type it into the file yourself; never paste it into chat. `ALLOWED_ORIGINS` already includes the Vercel domain. Restart the backend (below).
5. **Test on production** (the assistant cannot enter passwords or create accounts on a non-local site):
   - sign up, then log in and log out;
   - create a workspace and a project, then refresh and check the project persists;
   - check the backend badge reads "online";
   - upload a short clip.

   For the RLS check, use a second account in another browser: it must not see the first account's project.
6. Ask teammate `Atharva486dherange` to accept the GitHub invitation.

## Frontend — Vercel Hobby
- Root Directory `apps/web`, framework Next.js, Node 24.x, install `pnpm install`.
- Env vars are inlined at build time → redeploy after changing them.
- Hobby may refuse Git-triggered deploys for commits authored by someone other than the project owner; the owner then redeploys from the dashboard. Never spoof authors.

## Local processing backend
```
cd C:\dev\Reel-Studio\apps\api
C:\Users\Sahil\AppData\Local\reel-studio\venv\Scripts\python -m app.serve --tunnel devtunnel   # API + worker + public tunnel (use this)
C:\Users\Sahil\AppData\Local\reel-studio\venv\Scripts\python -m app.serve --tunnel none        # local only
```
`--tunnel cloudflare` and `--tunnel tailscale` remain in the launcher for other networks; both fail on the current one (D-024).

## Tunnel: Microsoft Dev Tunnels (D-024)
- One-time setup (done 2026-10-16): `winget install Microsoft.devtunnel`, then `devtunnel user login -g -d` (GitHub device code, account `sahilkarande0918-cmd`). The launcher creates the persistent tunnel `reel-studio` with anonymous relay access and port 8000 on first run. The URL is stable, and the tunnel expires after 30 days of inactivity.
- Free limits: 5 GB/month bandwidth per user, **16 MB max request body** (uploads use 8 MiB chunks), 20 MB/s, 1,500 requests/min per port. A 1 GB lecture upload uses 1 GB of the monthly 5 GB.
- Security: anonymous relay access is required for browsers. Every processing route needs a Supabase JWT plus an org-role check. Media and downloads use 6-hour HMAC-signed URLs. CORS is restricted to `ALLOWED_ORIGINS`. Uploads are capped at 4 GB and ffprobe-validated.
- Browsers get an HTML warning page only on direct navigation. API calls send `X-Tunnel-Skip-AntiPhishing-Page`, `<video>` requests are not intercepted (verified), and downloads use fetch + blob.
- **This network intercepts `*.devtunnels.ms` too.** A browser on the owner's network falls back to `http://127.0.0.1:8000`, which works only on the machine running the backend; Chrome may ask once for local-network access. Judges on other networks use the tunnel. To check from outside: `gh workflow run backend-probe.yml -f url=<tunnel url>`.

## Tailscale (diagnosed 2026-10-16)
Installed (1.104.1), service running, CLI at `C:\Program Files\Tailscale\tailscale.exe`, but **logged out** (`NeedsLogin`). Login cannot complete on this network: Fortinet presents an untrusted certificate for `controlplane.tailscale.com` and blocks the DERP relays (Tailscale's own health message says so). Nothing is wrong with the install. On an unfiltered network (e.g. a phone hotspot), `tailscale up` → approve in the browser → enable Funnel for the node → `python -m app.serve --tunnel tailscale` would also work.

## Known limitations
- Heavy processing (ASR, OCR, LLM, rendering) only runs while the owner's machine, API, worker and tunnel are up; the UI shows a truthful offline state otherwise.
- Renders load GSAP from jsDelivr, so the processing machine needs internet while rendering.
