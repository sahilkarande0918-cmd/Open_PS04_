# Deployment

Status: **not deployed yet** (Phase 01).

## Frontend — Vercel Hobby
- Project root: `apps/web`. Framework preset: Next.js. Install command: `pnpm install` (workspace root).
- Env vars: see `docs/ENVIRONMENT.md` (only `NEXT_PUBLIC_*` public config on Vercel).
- Hobby is non-commercial use only — hackathon demo qualifies.
- Hobby may refuse Git-triggered deployments for commits whose author is not the Vercel project owner. If teammates' commits are blocked, the owner deploys from `main` (`npx vercel --prod` or "Redeploy" in dashboard). Never spoof authors.
- Production URL: _to be recorded_.

## Database/Auth — Supabase Free
- Project: `Reel-Studio` in the friend's organization (ref to be recorded once verified).
- Migrations: `supabase/migrations/*.sql`, applied with `npx supabase db push` after `npx supabase link --project-ref <verified-ref>`.
- Auth redirect URLs (Dashboard → Authentication → URL Configuration): Site URL = Vercel production URL; additional: `http://localhost:3000/**`, `https://<vercel-domain>/**`.

## Local processing backend
```
cd apps/api
py -3.11 -m venv .venv
.venv/Scripts/pip install -r requirements/base.txt
.venv/Scripts/uvicorn app.main:app --port 8000      # API
.venv/Scripts/python -m app.workers.run             # worker
```

## Tunnel (free)
Primary: Cloudflare quick tunnel — `cloudflared tunnel --url http://localhost:8000` (no account; URL changes per start; best-effort; ~100 MB request body limit → uploads are chunked).
Fallback: ngrok free static domain (monthly data cap — avoid for large uploads).
The backend publishes its current URL to Supabase `backend_endpoints`; the frontend discovers it. When no fresh heartbeat exists the UI shows "Processing backend offline" and disables upload/render/publish actions.

## Known limitations
- Heavy processing is available only while the owner's machine, worker and tunnel are running.
- Free tunnel URLs are ephemeral.
