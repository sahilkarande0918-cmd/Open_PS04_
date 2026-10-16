# Deployment

## Current state (2026-10-16)

| Piece | State | Evidence |
|-------|-------|----------|
| Vercel project `reel-studio` (team *sahilkarande0918-9163's projects*) | Deployed from `main`, build READY | Vercel API: deployment `dpl_22AwHfno…` READY |
| Production URL | https://reel-studio-taupe.vercel.app | project domains |
| Runtime | ⛔ **every route 500** | runtime error: "Your project's URL and Key are required to create a Supabase client!" — Vercel env vars not set |
| Supabase project | `adjwycjsxtxvjockxtan` (Reel-Studio, friend's org) reachable; ⛔ **no migrations applied** (`PGRST205` on `backend_endpoints`) | REST probe with publishable key |
| Supabase CLI access | ⛔ the logged-in CLI account sees only the owner's personal org; Reel-Studio is not listed | `supabase orgs list` / `projects list` |
| Email confirmation | ON (`mailer_autoconfirm: false`); built-in SMTP only reaches team addresses at a low hourly rate | `/auth/v1/settings` |
| Tunnel | Launcher ready; ⛔ Cloudflare blocked on current network (port 7844); Tailscale Funnel option needs owner install | `cloudflared` pre-checks |

## Frontend — Vercel Hobby
- Root Directory: `apps/web`. Framework Next.js. Install: `pnpm install`.
- **Required env vars** (Settings → Environment Variables, all environments):
  - `NEXT_PUBLIC_SUPABASE_URL=https://adjwycjsxtxvjockxtan.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…` (public)
  - `NEXT_PUBLIC_SITE_URL=https://reel-studio-taupe.vercel.app` (Production)
  - Then redeploy (env vars are inlined at build time).
- Hobby may refuse Git-triggered deploys for commits authored by someone other than the project owner. The owner redeploys from the dashboard in that case. Never spoof authors.
- Vercel Authentication ("Standard protection") is on for preview deployment URLs; the production domain is public.

## Database/Auth — Supabase Free
1. Get CLI access to the friend's org (accept the Developer invitation; `pnpm exec supabase login` with that account) **or** apply SQL manually in the Reel-Studio SQL Editor.
2. CLI path: `pnpm exec supabase link --project-ref adjwycjsxtxvjockxtan` → `pnpm exec supabase db push` (prompts for the DB password in the terminal).
3. Manual path: run each file in `supabase/migrations/` in timestamp order in the SQL Editor.
4. Authentication → URL Configuration: Site URL `https://reel-studio-taupe.vercel.app`; Redirect URLs `https://reel-studio-taupe.vercel.app/**`, `http://localhost:3000/**`. (May need the Owner account.)
5. For a public demo: Authentication → Providers → Email → turn off "Confirm email", or configure a free SMTP provider. Otherwise judges cannot finish signup.

## Local processing backend
```
cd apps/api
py -3.11 -m venv %LOCALAPPDATA%\reel-studio\venv
%LOCALAPPDATA%\reel-studio\venv\Scripts\pip install -r requirements/ml.txt
%LOCALAPPDATA%\reel-studio\venv\Scripts\python -m app.serve            # tunnel + API + worker
```
`apps/api/.env` needs `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (backend only), `ALLOWED_ORIGINS=https://reel-studio-taupe.vercel.app,http://localhost:3000`, `DATA_DIR` outside OneDrive.

## Tunnel (free)
- `python -m app.serve` — Cloudflare quick tunnel over HTTP/2. No account. URL changes per start; the API heartbeats it to `backend_endpoints` and the frontend discovers it. Requires outbound TCP 7844 (blocked on the owner's current network).
- `python -m app.serve --tunnel tailscale` — Tailscale Funnel. Free personal plan, outbound 443 only, stable `https://<machine>.<tailnet>.ts.net`. Owner installs Tailscale, signs in, enables Funnel for the machine in the admin console.
- Security on the tunnel: every processing endpoint requires a Supabase session token verified by Supabase Auth; org membership is checked server-side; CORS allows only `ALLOWED_ORIGINS`; media playback uses 6-hour HMAC-signed URLs; uploads capped at 4 GB / 16 MB chunks.

## Known limitations
- Heavy processing only while the owner's machine, worker and tunnel are running; the UI shows a truthful offline state otherwise.
- Quick-tunnel URLs are ephemeral and have no uptime guarantee.
