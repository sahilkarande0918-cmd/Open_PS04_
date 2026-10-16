# Phases

**Current phase:** 01 — Frontend, auth, database, deployment (in progress; blocked on owner logins for remote Supabase + Vercel)

Legend: ✅ verified · 🟡 in progress · ⬜ not started · ⛔ blocked (reason)

| Phase | Title | Status |
|-------|-------|--------|
| 00 | Repository, contributors, foundation | ✅ |
| 01 | Frontend, auth, database, deployment | 🟡 |
| 02 | Recording ingestion & transcription | ⬜ |
| 03 | Highlights & screen intelligence (reframing) | ⬜ |
| 04 | Captions, branding, Hyperframes rendering | ⬜ |
| 05 | Topic-to-video | ⬜ |
| 06 | Advanced timeline editor | ⬜ |
| 07 | Instagram & YouTube publishing | ⬜ |
| 08 | Analytics, feedback, SaaS management | ⬜ |
| 09 | Final integration, testing, submission | ⬜ |

Full task lists and acceptance criteria: `docs/MASTER_PROMPT.md` Section 19. Results below.

## Phase 00
Objective: correct repo, team invitations, preserved prompt, docs, monorepo skeleton.

| Item | Status | Evidence |
|------|--------|----------|
| GitHub auth verified (admin on repo) | ✅ | `gh auth status`, repo permissions `admin: true` |
| Remote = `sahilkarande0918-cmd/Reel-Studio` | ✅ | `git remote -v` |
| Invitations sent: sahillokhande5841-cmyk, Atharva486dherange, SK999CodingWorld | ✅ sent / pending acceptance | API `201 Created`, `GET /invitations` lists all 3 (write permission) |
| Master prompt preserved verbatim | ✅ | `docs/MASTER_PROMPT.md`, addendum `docs/MASTER_PROMPT_SUPABASE_ADDENDUM.md` |
| CLAUDE.md, AGENTS.md, persistent docs | ✅ | `docs/` |
| Ponytail installed & active | ✅ | `~/.claude/settings.json` `ponytail@ponytail: true`, SessionStart hook active |
| Design skills | ✅ | Hallmark + Taste Skill (`design-taste-frontend`) installed in `~/.claude/skills` |
| External repo licence review | ✅ | `docs/THIRD_PARTY_LICENSES.md` |
| Monorepo skeleton | ✅ | pnpm workspace, `apps/web`, `apps/api`, `supabase/` |
| Issue labels / phase tracking | ✅ | 9 labels, 10 milestones (Phase 00–09) |
| First commits pushed | ✅ | `main` on origin |

## Phase 01
| Task | Status | Evidence |
|------|--------|----------|
| Next.js 16 + TS + Tailwind v4 | ✅ | `next build` passes |
| Design tokens + landing page | ✅ | taste-skill inspector: 0 FAIL (1 WARN: no footage, defended) |
| Supabase SSR auth: signup/login/logout/reset/confirm | ✅ local | browser test on local stack |
| Protected routes (proxy.ts) | ✅ | `curl /dashboard` → 307 `/login?next=/dashboard` |
| Workspace model + onboarding | ✅ local | created "Nimbu Academy" via UI, role owner |
| Migrations + RLS | ✅ local | `supabase test db` 16/16, `supabase db lint` clean |
| FastAPI + /health + JWT auth | ✅ | pytest 5/5; `/me` real token 200, tampered 401 |
| Frontend ↔ backend discovery, offline state | ✅ local | heartbeat row fresh; badge online → offline after API stop |
| Remote Supabase project (friend's org) | ⛔ owner | project `adjwycjsxtxvjockxtan` reachable but empty; CLI account cannot see it (see DEPLOYMENT.md) |
| Vercel deployment | ⛔ owner | deployed READY at https://reel-studio-taupe.vercel.app but every route 500: env vars missing (Vercel connector has no env permission, CLI logged out) |
| Tunnel | 🟡 | `python -m app.serve` (Cloudflare http2 / Tailscale Funnel); Cloudflare blocked on current network (port 7844) |
| Repo moved out of OneDrive | ✅ | `C:\dev\Reel-Studio`, fresh clone, history intact |

## Phase 02 — in progress
| Task | Status | Evidence |
|------|--------|----------|
| Recording-upload UI (drag-drop, progress, resume, offline state) | ✅ code | `components/studio/uploader.tsx` |
| Backend ingestion, chunked resumable, validation | ✅ | upload integration tests 6/6 |
| FFprobe metadata / audio extraction | ✅ code | `services/media.py` (run in job) |
| faster-whisper | 🟡 | installing CUDA libs; model: Oriserve Hinglish-Apex (CT2 conversion) |
| WhisperX alignment | ⬜ | optional stage, needs torch cu128 |
| Store transcript (raw + corrected, words, segments) | ✅ schema | migration 20261016140000 |
| Glossary correction + institute glossary | ✅ | glossary tests 5/5, `/glossary` page |
| Transcript editor synced to video | ✅ code | `transcript-view.tsx` (needs real run) |
| Progress, retries, cancellation | ✅ code | worker `run.py` (needs real run) |
| Benchmark | ⬜ | |
