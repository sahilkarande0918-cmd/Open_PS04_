# Phases

**Current phase:** next is **Phase 04 — captions, branding, Hyperframes MP4 rendering**. Phases 02–03 verified on synthetic fixtures only. Phase 01 production integration is blocked on owner actions (remote Supabase migrations, tunnel) and runs in parallel.

Legend: ✅ verified · 🟡 in progress · ⬜ not started · ⛔ blocked (reason)

| Phase | Title | Status |
|-------|-------|--------|
| 00 | Repository, contributors, foundation | ✅ |
| 01 | Frontend, auth, database, deployment | 🟡 local ✅ · production blocked |
| 02 | Recording ingestion & transcription | 🟡 synthetic-verified |
| 03 | Highlights & screen intelligence (reframing) | 🟡 synthetic-verified |
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
| Invitations: sahillokhande5841-cmyk, Atharva486dherange, SK999CodingWorld | ✅ sent · accepted: sahillokhande5841-cmyk, SK999CodingWorld · pending: Atharva486dherange (2026-10-16) | `GET /collaborators`, `GET /invitations` |
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
| Remote Supabase project (friend's org) | ⛔ owner | `adjwycjsxtxvjockxtan` reachable but **no migrations applied**; CLI account cannot see it (DEPLOYMENT.md) |
| Vercel deployment | ✅ pages / 🟡 app | https://reel-studio-taupe.vercel.app — owner set env vars; public pages 200, protected 307→login; app data flows fail until the remote DB has migrations |
| Tunnel | 🟡 | `python -m app.serve` (Cloudflare http2 / Tailscale Funnel); Cloudflare blocked on current network (port 7844) |
| Repo moved out of OneDrive | ✅ | `C:\dev\Reel-Studio`, fresh clone, history intact |

## Phase 02 — verified on synthetic fixtures
| Task | Status | Evidence |
|------|--------|----------|
| Recording-upload UI (drag-drop, progress, resume, offline state) | ✅ code | `components/studio/uploader.tsx` |
| Backend ingestion, chunked resumable, validation | ✅ | upload integration tests 6/6 |
| FFprobe metadata / audio extraction | ✅ code | `services/media.py` (run in job) |
| faster-whisper | ✅ | Hinglish-Apex CT2 on CUDA, 25.8× real time on the 192 s lecture |
| WhisperX alignment | ⬜ deferred | D-016: no Roman-Hinglish alignment model; faster-whisper word timing measured ±0.27 s |
| Store transcript (raw + corrected, words, segments) | ✅ schema | migration 20261016140000 |
| Glossary correction + institute glossary | ✅ | glossary tests 5/5, `/glossary` page |
| Transcript editor synced to video | ✅ | browser: search, seek, highlight follows playback, edit persists |
| Progress, retries, cancellation | ✅ | UI cancel/retry; worker kill → stale requeue → attempt 2 succeeded |
| Benchmark | ✅ | 7.45 s for 192.5 s audio, 2.2 GB GPU (TEST_STATUS) |
| **Acceptance** | 🟡 | all criteria pass on the SYNTHETIC lecture; real-world recording unverified (none legally free); AbortController/Kubernetes misses → Phase 03 OCR |

## Phase 03 — verified on synthetic fixtures
| Task | Status | Evidence |
|------|--------|----------|
| Speech energy, pauses | ✅ | `audio_features.py` self-check; speaker-relative pause ranking |
| Screen changes / activity / scene cuts | ✅ | 2 fps change map; cuts at exact window switches on focus fixture (26.0 s, 31.5 s) |
| Screen OCR + evidence-based term correction | ✅ | AbortController 0/4 → 4/4 on lecture; WER 31.1 % → 28.2 %; guards tested |
| Semantic candidates + complete-thought boundaries | ✅ | lecture: 2/2 clips start and end on real topic boundaries |
| Ranking, dedupe, reasons | ✅ | NMS, labelled heuristic(+LLM) score, reasons per clip |
| Local LLM judgment | ✅ | Ollama qwen2.5vl:7b, temperature 0; vetoes on agreement |
| Active-region reframing + smoothing | ✅ | 7 scenario tests; stable keyframes on real frames |
| Clip selection UI, crop preview/override | ✅ | browser: select, boundary edit snaps to word end (61.19 s), manual crop keyframe persisted |
| Judge-style recordings | 🟡 | static/typing/jitter/long lines/scroll/window-switch covered (unit + fixtures); changing *diagram* and slides not yet in a real fixture |
| Real class recording | ⛔ | none legally obtainable at ₹0 (TEST_STATUS) |
