# Codex takeover: hackathon execution plan (2026-10-17)

**Status:** This file is an execution-priority overlay, NOT a replacement for the original PS, master prompt, security invariants, phase history or verified tests. It is written for Codex taking over development while Claude Code usage is unavailable.

## First: establish the actual state

- Repository: https://github.com/sahilkarande0918-cmd/Reel-Studio
- Correct local checkout: C:\dev\Reel-Studio. The OneDrive Desktop/Reel Studio copy is STALE; never edit or run migrations from it.
- Production frontend: https://reel-studio-taupe.vercel.app (Vercel; root apps/web).
- Supabase: only the dedicated friend's-org Reel-Studio project, reference adjwycjsxtxvjockxtan. NEVER select the user's personal SaaS project.
- Backend: Python FastAPI + worker on local GPU, via Microsoft Dev Tunnels. The local machine must remain on for rendering and publishing schedules.
- Consult docs/DEPLOYMENT.md and docs/TEST_STATUS.md for verified/current states; some historical passages in PHASES/HANDOFF are stale. Reconcile after testing; do not reproduce old blockers uncritically.
- Last repository audit: Phase 04 exported branded portrait MP4, intro/outro, captions, SRT/VTT, project brand kits, highlight crop keyframes, and render caching; local synthetic tests passed. Production upload/transcribe/analyze on a real 7.5-min physics recording passed. Independent real programming-class testing and a full production render are not confirmed. Phases 05-08 were not yet implemented at audit. Check git/working tree for any newer changes.

## Mandatory reading order in a Codex session

1. AGENTS.md (common engineering guardrails) and this file.
2. CLAUDE.md (existing project constraints; it is not instructions to impersonate Claude).
3. docs/MASTER_PROMPT.md and docs/MASTER_PROMPT_SUPABASE_ADDENDUM.md (do not rewrite).
4. docs/ORIGINAL_PS.md (official, unmodified feature contract).
5. docs/PHASES.md, docs/ARCHITECTURE.md, docs/DECISIONS.md.
6. docs/CURRENT_TASK.md, docs/HANDOFF.md, docs/TEST_STATUS.md, docs/DEPLOYMENT.md, docs/ENVIRONMENT.md.
7. git status, git log --oneline -20, and only relevant source files.

## Immediate delivery priority under hackathon time pressure

This is a **vertical-slice / judge-demo priority override**; all official PS features, including optional social distribution and analytics feedback, remain in scope.

**Priority A — Mode B topic-to-video (Phase 05):** Enter JSON vs XML; generate valid local-LLM storyboard/script and accurate code examples; synthesize voiceover through a free local TTS model; synchronize captions; animate code being typed/changed; use existing timeline/Hyperframes renderer; render, preview, download a genuine ~45 s MP4. Fix integration failures ahead of extra knobs.

**Priority B — Core UI redesign in parallel with feature work:** Existing application is too basic. Use the four user-provided screenshots as **structural wireframe references only**, not the colors, logo, people, sample metrics, account names or exact design. The user should re-attach these reference JPEGs to Codex if Codex cannot view them. Create a distinct, refined, contemporary product identity (avoid copying screenshot dark + amber palette and generic blue/purple gradients). Build shared visual design tokens, typography, page shells, responsive layouts, loading/error states, and real data binding before individual page polish.

**Priority C — Working timeline editor (Phase 06):** Implement consistent multi-track controls on the existing Zod timeline: real split/trim, clips, captions, text overlays, audio, transforms/reframe, undo/redo, autosave, synchronized playback, and export/re-render. More advanced decorative transitions can follow after these work end-to-end. Do not build a competing timeline schema or an editor that cannot export its edits.

**Priority D — Instagram and YouTube delivery (Phase 07):** Official OAuth for eligible accounts, secure token storage, real API upload/publish, durable scheduling, retry/status/idempotency and meaningful failures. Instagram professional account + Meta permissions, YouTube channel + Google OAuth and Data API must be configured by owner. Reuse inspected Instagram MCP source when legally/technically appropriate, but product backend should use official APIs. No browser-login scraping, fake publish-success or mocked posts labeled live. If external approvals block live post, keep the genuinely implemented API integration and accurately disclose the blocker.

**Priority E — Analytics feedback (Phase 08 PS optional):** Real API metrics where authorized; label synthetic fixtures; dashboard with views/engagement and available watch metrics; feedback weights influencing future highlight ranking with transparent changes.

**Priority F — Final demo and QA (Phase 09):** Successful judge walkthrough on Vercel + local GPU, 2 modes, edit, export, account connect/scheduling, analytics; README/recorded evidence; targeted tests and security checks.

**Time permitting after the PS is operational:** subscription checkout, real-money billing, complex plan tiers, deep admin tooling, exhaustive browser coverage, giant template libraries, advanced editor animation/effects, edge-case optimizations. Keep core org/auth/RLS, safe uploads, OAuth protection and publishing idempotency; they are needed for a functioning public app and are NOT optional.

## Visual structure derived from provided reference mockups (NOT exact style)

1. **Dashboard:** sidebar/workspace selector + header; compact real project KPIs; active projects grid with real thumbnails; processing jobs/status; recent activity; upcoming scheduled posts. No invented 142 videos/87 published counters.
2. **Recording Studio:** original lecture player prominently displayed, processing steps/status, searchable time-synced Hinglish transcript, ranked highlight cards and readable smart 9:16 crop preview. Create/select/adjust a highlight and launch editor/export.
3. **Editor:** three-column editing workspace with asset/media browser, centered 9:16 canvas and real playback, settings/inspector (caption styles, smart crop, brand), full-width bottom multi-track timeline (video/caption/overlay/audio/brand), functioning undo/redo/export.
4. **Publish/Analytics:** calendar and queue with pending/posted/error states, eligible connected accounts, real analytics cards/charts, AI feedback panel based on actual metrics.
5. **Topic Studio:** clear prominent prompt input, subject/style/language/voice controls, editable script/storyboard, code-typing scene preview, genuine generation progress and render/export.

Design rules: visually coherent desktop editor, readable controls and hierarchy, restrained modern colors distinctly different from supplied screenshots, proper responsive treatment, no clutter or stock mockups masquerading as data. Use Taste/Hallmark inspiration only when useful. Never add a Vue-only UI library to React. Accessible keyboard interactions and standard empty states matter.

## Practical quality bar

- Every primary control must work; no placeholder publishing or fake analytics.
- Keep actual error/loading/progress states and empty-state guidance.
- Test real rendered MP4 with ffprobe, play it in UI, review sample frames/caption timing.
- Run quick lint/typecheck/backend tests at each change; preserve targeted integration tests.
- Avoid rerunning expensive OCR/GPU benchmarks during simple UI work.
- Ensure Vercel deploys after frontend changes and real remote production environment is not overwritten by local settings.
- Only ₹0 mandatory cost; no billable AI inference/hosting. Reuse local Ollama, Kokoro, Hyperframes, FFmpeg and worker.
- Never modify the user’s separate Supabase SaaS project. Verify project ref before remote migrations.
- Preserve RLS, least-privilege grants, authenticated local GPU routes, encrypted OAuth tokens, and platform permissions.
- No AI/agent (Claude, Codex, ChatGPT, Anthropic, OpenAI) credited as developer, Git author, co-author or contributor. Do not impersonate teammates or alter commit times. Keep human commit authorship genuine.
- Use git branches/meaningful commits, maintain docs/CURRENT_TASK.md, PHASES.md, HANDOFF.md, TEST_STATUS.md, DEPLOYMENT.md. On handback to Claude, it should read this file along with its existing ordered docs.

## Owner dependencies, surfaced early and precisely

- Instagram: eligible professional account, official Meta app, permission grants, callback URL; publishing media must be publicly fetchable HTTPS for ingest.
- YouTube: real Google OAuth/client, channel authorization, API quotas and potential unverified-app restrictions.
- Supabase migrations: verify exact remote migration list; owner may need to apply new migration from correct folder.
- Backend: must be running, tunnel reachable externally, scheduler process alive for due jobs.
- No secrets in chat, tracked source, git commits, public assets or screenshots. User enters credentials through private env/CLI/dashboard.

## Session restart / handoff protocol

At each meaningful milestone: inspect diff; run relevant tests; commit completed code; push only with legitimate human identity; update PHASES/CURRENT_TASK/HANDOFF/TEST_STATUS. Before pausing, record exact task, what passed, failing tests, owner blockers, local running processes, branch, latest SHA and uncommitted files. Resume by reading the mandatory order above and checking actual git state rather than assuming memory.

**First action:** audit local repository state for concurrent work, then deliver Mode B end-to-end, immediately followed by targeted UI redesign and the timeline editor. Do not spend the hackathon window refactoring already-working Phase 02-04 internals or tuning unrelated authentication unless it blocks real flows.
