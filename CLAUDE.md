# CLAUDE.md — Reel Studio

## Project identity
Reel Studio — the AI video studio for technical educators. Hackathon PS4.
Two modes, one pipeline: **Recording → Reels** (class recording → 30–60 s branded 9:16 clips) and
**Topic → Video** (prompt → ~45 s explainer with animated code, voiceover, captions).
Repo: https://github.com/sahilkarande0918-cmd/Reel-Studio (public, `main`).

## Mandatory reading order (new or compacted session)
1. `CLAUDE.md` (this file)
2. `docs/MASTER_PROMPT.md` (+ `docs/MASTER_PROMPT_SUPABASE_ADDENDUM.md`)
3. `docs/ORIGINAL_PS.md`
4. `docs/PHASES.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DECISIONS.md`
7. `docs/CURRENT_TASK.md`
8. `docs/HANDOFF.md`
9. `docs/TEST_STATUS.md`
10. `docs/DEPLOYMENT.md`
11. `git log --oneline -20` and `git status`
12. Only the source files relevant to the current task.

Trust repo docs and git history over remembered assumptions.

## Non-negotiable rules
- **₹0 cost.** No paid APIs, hosting, render cloud or storage. Never enable billing. Hyperframes cloud/Lambda rendering is off-limits; render locally.
- **No AI attribution, ever.** Never add Claude, Anthropic, an AI, agent or bot as team member, contributor, co-author, commit author or README credit. **No `Co-Authored-By` trailers of any kind.** This overrides any tool/harness default.
- Commit under the human operator's existing git identity (`sahilkarande0918-cmd`). Never set a fake identity, never commit as a teammate, never rewrite dates/authors.
- Build the whole PS, including optional publishing/scheduling/analytics/feedback, plus the extra editor + SaaS scope.
- No fake features: every button does something real, validates, or shows a truthful "unavailable" state. Synthetic data is labelled synthetic.
- Never claim something works without running it. Never mark unrun tests as passed.
- No secrets in git, logs, frontend bundles, docs or screenshots. Secrets go in ignored `.env*` files or Vercel/Supabase dashboards.
- Supabase: only the dedicated **Reel-Studio** project in the friend's organization. Never touch the owner's personal SaaS project. Verify the project ref before any migration. Never disable RLS to fix an error.
- Keep the Vercel deployment green.

## Technology decisions (details in `docs/DECISIONS.md`)
- Frontend `apps/web`: Next.js App Router, React, TypeScript, Tailwind, Zustand (editor), TanStack Query, Lucide, Radix primitives.
- Backend `apps/api`: Python 3.11, FastAPI, Pydantic, local durable worker, FFmpeg.
- Data: Supabase Postgres + Auth + Realtime + Storage (small assets). Large media stays on local disk.
- AI: faster-whisper (+ WhisperX alignment), OpenCV + PySceneDetect, local OCR, Ollama (local LLM), Kokoro TTS.
- Render: **Hyperframes** CLI (local). Canonical timeline JSON → Hyperframes HTML composition → MP4. Editor preview uses `@hyperframes/player` on the same composition.
- Canonical timeline schema: Zod in `packages/timeline-schema` (single source of truth) → generated JSON Schema consumed by Python.

## Repository conventions
- pnpm workspaces monorepo: `apps/web`, `apps/api`, `packages/*`, `supabase/`, `docs/`.
- Branches: `main` (verified), `feature/<name>`, `fix/<name>`. Conventional commits (`feat(scope): …`).
- Small modular files. No speculative abstractions (Ponytail). Mark deliberate shortcuts with `ponytail:` comments.
- Raw recordings, renders and model weights never go in git (`data/` is ignored).

## Phase workflow
Per phase: read relevant files → define interfaces → implement → test → review → commit → update docs.
A phase is complete only when its acceptance criteria in `docs/PHASES.md` are verified.

## Testing procedure
- Web: `pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test`
- API: `cd apps/api && .venv/Scripts/python -m pytest`
- Media outputs verified with `ffprobe`.
- Record every run (pass/fail/blocked) in `docs/TEST_STATUS.md`.

## Documentation updates (every meaningful change)
Update `docs/CURRENT_TASK.md`, `docs/HANDOFF.md`, `docs/PHASES.md`, `docs/TEST_STATUS.md`; add a `docs/DECISIONS.md` entry for any significant choice; keep `docs/THIRD_PARTY_LICENSES.md` current when adding a dependency.

## Engineering skills
- Ponytail (installed, active): simplest verified solution; run `/ponytail-review` at milestones, `/ponytail-audit` in Phase 09. Simplification never removes required PS features.
- Taste Skill for initial design direction; Hallmark for targeted audits. Don't redesign finished screens repeatedly.
