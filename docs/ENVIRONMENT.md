# Environment

Never commit real values. Files `.env`, `.env.local`, `apps/*/.env*` are git-ignored; only `*.example` files are tracked.

## Frontend (`apps/web/.env.local`, and Vercel → Project → Settings → Environment Variables)

| Variable | Public? | Where to find it |
|----------|---------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | public config | Supabase Dashboard → Reel-Studio project → **Project Settings → Data API** → Project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public config | **Project Settings → API Keys** → Publishable key (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | public config | `http://localhost:3000` locally; the Vercel production URL in Vercel |
| `NEXT_PUBLIC_API_URL` | public config | Optional override of the local backend URL (normally discovered via `backend_endpoints`) |

## Backend (`apps/api/.env`, local machine only)

| Variable | Secret? | Where |
|----------|---------|-------|
| `SUPABASE_URL` | public config | same as above |
| `SUPABASE_SECRET_KEY` | **SECRET** | **Project Settings → API Keys → Secret keys** (`sb_secret_…`). Paste only into `apps/api/.env`. Never into chat, git, or Vercel `NEXT_PUBLIC_*`. |
| `TOKEN_ENCRYPTION_KEY` | **SECRET** | Generate locally: `python -c "import secrets,base64;print(base64.b64encode(secrets.token_bytes(32)).decode())"` |
| `ALLOWED_ORIGINS` | config | `http://localhost:3000,https://<vercel-domain>` |
| `DATA_DIR` | config | default `./data` |
| `OLLAMA_URL` | config | `http://localhost:11434` |
| `PUBLIC_API_URL` | config | the tunnel URL (auto-detected when the tunnel helper is used) |

Phase 07 additions (secrets, backend only): `META_APP_ID`, `META_APP_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Supabase project identification
- **Only** the `Reel-Studio` project inside the friend's organization (owner account invited as Developer).
- Project Reference ID: Dashboard → Project Settings → General → Reference ID. It is also the subdomain of the Project URL.
- Before any migration: `supabase projects list` must show the ref next to the name `Reel-Studio`; `supabase link --project-ref <ref>` only with that ref.
- The owner's personal SaaS project must never be linked, listed for selection, or queried.

## Supabase CLI
Run via `npx supabase` (no global install). Login: `npx supabase login` (opens browser; token stored by the CLI, not in the repo).
`supabase db push` asks for the database password — type it into the CLI prompt only.

## Local machine (verified 2026-10-16)
- Windows 11, NVIDIA RTX 5050 Laptop GPU 8 GB (driver 616.64), CUDA 12.8 toolkit
- Node 24.13.1, pnpm 12.5.1, Python 3.11 (backend venv), FFmpeg/FFprobe 8.1.2
- Ollama running, model present: `qwen2.5vl:7b`
- Docker 29.6.2 available (not required)
- Not installed yet: Tesseract, cloudflared, Supabase CLI (use `npx`), Vercel CLI (use `npx`)
- Note: the repo lives under OneDrive. `data/` and `node_modules/` should be excluded from OneDrive sync (or the repo moved outside OneDrive) to avoid sync churn on large media.
