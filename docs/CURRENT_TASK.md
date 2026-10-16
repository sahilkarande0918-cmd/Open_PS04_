# Current task

**Phase 01 — finish deployment.** All Phase 01 code works against the local Supabase stack (Docker). Remaining: connect the remote `Reel-Studio` Supabase project and deploy `apps/web` to Vercel.

Blockers (owner action):
1. Supabase: `pnpm exec supabase login` with the Developer account; share the Reel-Studio project ref (public).
2. Vercel: authorize deployment (Vercel login or dashboard import with root `apps/web`).

Next action after unblock: `supabase link --project-ref <ref>` → `supabase db push` → set Vercel env vars → deploy → set Auth redirect URLs → re-run auth flow on production.
While blocked: Phase 02 (upload + ingestion + transcription) can proceed locally.
