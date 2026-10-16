# Handoff

_Last updated: 2026-10-16, Phase 00._

## Verified state
- Repo cloned at `C:\Users\Sahil\OneDrive\Desktop\Reel Studio`, remote `origin` = `sahilkarande0918-cmd/Reel-Studio`.
- Invitations to the 3 teammates sent (write permission), pending their acceptance.
- Ponytail plugin active; Hallmark skill installed.
- Docs created (see `CLAUDE.md` reading order).

## Unfinished
- Monorepo skeleton, first commit/push.
- Taste Skill install, GitHub labels/milestones.
- Everything from Phase 01 on.

## Environment dependencies
See `docs/ENVIRONMENT.md` → "Local machine".

## Important decisions
`docs/DECISIONS.md` D-001…D-013 (Hyperframes renderer + player preview, Zod canonical timeline, Supabase-backed durable jobs, tunnel URL discovery, chunked uploads, Python 3.11).

## Next actions
1. Commit + push Phase 00.
2. Phase 01: Next.js app shell + landing + auth pages; FastAPI `/health`; Supabase migrations (identity, orgs, jobs, backend_endpoints) with RLS.
3. Ask owner for: `npx supabase login` (Developer account), confirm `Reel-Studio` project ref; `npx vercel login`.
