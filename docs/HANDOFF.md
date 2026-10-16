# Handoff — Reel Studio

_Written at the end of session 1 (2026-10-16) as a pre-compaction checkpoint. Read with `CLAUDE.md`
(mandatory reading order). Everything here was verified in this session unless marked otherwise._

## 1. Project identity and objective
Reel Studio — "the AI video studio built for technical educators". Hackathon PS4, 24-hour national
hackathon. Turns (A) long Hinglish programming-class screen recordings into ranked, branded 30–60 s
9:16 reels and (B) a topic prompt (e.g. "JSON vs XML") into a ~45 s explainer with animated code,
local voiceover and captions. Both modes share one editor, renderer (Hyperframes), publishing,
analytics and feedback loop. Hard rules: ₹0 cost, no fake features, no AI attribution in git, genuine
human commits only (operator identity `sahilkarande0918-cmd <sahilkarande0918@gmail.com>`).

## 2. Problem statement
`docs/ORIGINAL_PS.md` (verbatim + PS-1…PS-11 checklist). Full instructions: `docs/MASTER_PROMPT.md`
(verbatim, do not edit) + `docs/MASTER_PROMPT_SUPABASE_ADDENDUM.md`.

## 3. Requirements
- **Mandatory PS:** Hinglish ASR with word timing; 30–60 s highlights from transcript + voice energy + screen
  change; complete-thought boundaries; active-region 9:16 reframing; word-synced captions with correct tech
  terms and code as formatted text; automatic brand kit (colours, fonts, logo, intro, outro); timeline
  editor with fast re-render; topic → 45 s explainer (script, animated code, voiceover, captions).
- **Optional PS (in scope):** schedule/publish to Instagram + YouTube (official APIs), performance tracking,
  feedback into highlight ranking.
- **Extra scope:** advanced multi-track editor, accounts, workspaces, teams, subscriptions (test mode), usage.

## 4. Architecture and stack
Next.js 16 on Vercel ↔ Supabase (Auth, Postgres+RLS, Realtime) ↔ local FastAPI + worker on the owner's
RTX 5050 laptop, reached through a free tunnel whose URL is heartbeated into `backend_endpoints`.
Details: `docs/ARCHITECTURE.md`. Decisions D-001…D-022: `docs/DECISIONS.md`.

## 5. Phase status and verification level
| Phase | Status | Verification |
|-------|--------|--------------|
| 00 Foundation | ✅ | repo, docs, Ponytail + Hallmark + Taste Skill, labels, 10 milestones; invitations: sahillokhande5841-cmyk ✅ accepted, SK999CodingWorld ✅ accepted, Atharva486dherange ⏳ pending |
| 01 Frontend/auth/DB/deploy | 🟡 | local stack: fully verified (auth, workspaces, projects, RLS 16/16, backend discovery). Production: pages 200 / protected 307, but remote DB has **no migrations** and **no public tunnel** |
| 02 Ingestion + transcription | 🟡 synthetic-verified | all acceptance steps pass on the generated lecture; real classroom validation not done |
| 03 Highlights + reframing | 🟡 synthetic-verified | OCR correction, highlights, reframing, UI pass on fixtures; diagram/slide footage not covered |
| 04 Captions/branding/render | ⬜ next | — |
| 05–09 | ⬜ | topic-to-video, advanced editor, IG/YT publishing+scheduler, analytics+feedback+SaaS, final QA/submission |

## 6. Current exact task
`docs/CURRENT_TASK.md` → Phase 04 first task: render one selected highlight to a 1080×1920 MP4 via the
canonical timeline + Hyperframes, with crop keyframes and word-synced captions.

## 7. Source directories and entry points
| Path | What |
|------|------|
| `apps/web/app/page.tsx` + `components/landing/*` | landing (live 9:16 crop demo) |
| `apps/web/app/(auth)/*`, `app/auth/confirm/route.ts`, `proxy.ts` | auth flows, session refresh, protected-route redirect |
| `apps/web/app/onboarding/*` | workspace creation (`create_organization` RPC), workspace switch cookie `rs_org` |
| `apps/web/app/(app)/layout.tsx`, `components/app/*` | app shell, sidebar (Dashboard, Projects, Glossary), backend badge |
| `apps/web/app/(app)/projects/[id]/page.tsx` → `components/studio/recording-studio.tsx` | studio: uploader, job progress, highlights, transcript |
| `apps/web/components/studio/{uploader,job-progress,transcript-view,highlights}.tsx` | chunked upload w/ resume; Realtime progress, cancel/retry; synced transcript editor; highlights + 9:16 preview + crop override |
| `apps/web/lib/{backend,realtime,media}.ts`, `lib/supabase/{client,server}.ts` | backend discovery + `apiFetch`, Realtime jobs hook, signed media URL hook, Supabase clients (`requireUser`, `requireOrg`) |
| `apps/api/app/main.py` | FastAPI app (`/health`, `/me`, `/recordings/*`) + heartbeat lifespan |
| `apps/api/app/serve.py` | **launcher**: tunnel (cloudflare/tailscale/none) + API + worker |
| `apps/api/app/api/recordings.py` | create/chunk/complete/status, `/transcribe`, `/analyze`, `/media-url`, `/media` |
| `apps/api/app/core/{auth,access,config,db,storage,heartbeat}.py` | Supabase-verified bearer auth, org-role checks (404 on foreign), settings, service client, UUID-only paths, URL heartbeat |
| `apps/api/app/workers/{run,jobs,transcribe,analyze}.py` | durable worker loop + job handlers |
| `apps/api/app/services/media.py` | ffprobe validation, audio extraction |
| `apps/api/app/services/transcription/{whisper,glossary,cleanup}.py` | ASR, term correction (dictionary/org/screen evidence), loop cleanup |
| `apps/api/app/services/screen_analysis/{activity,ocr,reframe}.py` | change maps, RapidOCR + identifiers, crop keyframes |
| `apps/api/app/services/highlights/{candidates,audio_features,llm}.py` | windows + scoring, energy/pauses, Ollama judge |
| `apps/api/tests/*` | unit tests + `bench_asr.py`, `eval_transcript.py`, `eval_highlights.py`, `test_upload_integration.py` |
| `tests/fixtures/lecture/{script,build,screen.html}` + `tests/fixtures/tts-onecore.ps1` | synthetic lecture generator |
| `scripts/convert-hinglish-model.sh` | CT2 conversion of the ASR model |
| `supabase/migrations/*.sql`, `supabase/tests/database/rls.test.sql`, `supabase/config.toml` | schema, RLS tests, local stack config |

## 8. How modules interact
Upload (web) → API writes chunks to disk → `complete` probes and inserts a `transcribe` job → worker
extracts audio, runs ASR, corrects terms, stores transcript/segments/words, marks recording `ready`,
inserts `analyze` job → worker samples screen activity, OCRs frames, applies screen-evidence fixes,
scores windows, asks the local LLM, plans crop keyframes, writes `highlight_candidates` → web reads
everything via Supabase (RLS) with Realtime invalidation; media plays from the API via HMAC-signed URLs;
user edits (words, highlight status/bounds/crop) go straight to Supabase via column-level grants.

## 9. Database
Migrations (applied to the **local** stack only):
`20261016120000_identity_orgs_jobs.sql`, `20261016140000_recordings_transcripts.sql`,
`20261016160000_highlights.sql`. Remote `adjwycjsxtxvjockxtan`: **none applied**.
Key RPCs: `create_organization`, `claim_next_job` (service role only), `requeue_stale_jobs` (service),
`cancel_job` (editors). Realtime publication: `jobs`, `source_recordings`, `highlight_candidates`.
Not yet created: brand kits, timelines/revisions, render jobs/export assets, social accounts, publish
jobs, metrics, feedback, plans/subscriptions/usage.

## 10. Local environment and paths
Repo `C:\dev\Reel-Studio` (old OneDrive copy obsolete). Venv `C:\Users\Sahil\AppData\Local\reel-studio\venv`.
Data `C:\Users\Sahil\AppData\Local\reel-studio\data` (orgs/…, models/, test-recordings/, test-audio/, tts-eval/).
Full tool list: `docs/ENVIRONMENT.md`.

## 11. Models and commands
- ASR: `data/models/hinglish-apex-ct2` (Oriserve Whisper-Hindi2Hinglish-Apex, Apache-2.0, fp16, use `language=hi`).
  Re-create: `CONVERT_PY=…/convert-venv/Scripts/python OUT=…/hinglish-apex-ct2 scripts/convert-hinglish-model.sh`.
- LLM: Ollama `qwen2.5vl:7b` (check `curl localhost:11434/api/tags`; `ollama list` hangs).
- OCR: RapidOCR (pip). TTS: `HYPERFRAMES_PYTHON=<venv python> npx --yes hyperframes@0.8.164 tts "<text>" --voice hm_omega --lang hi -o out.wav`.
- Start everything locally: Docker Desktop → `pnpm exec supabase start -x vector,logflare,imgproxy,edge-runtime`
  → `cd apps/api && <venv>/python -m app.serve --tunnel none` → `pnpm dev` (root) → http://localhost:3000.

## 12. Local test fixtures (synthetic, git-ignored)
`data/test-recordings/react-hooks-hinglish.mp4` (192.5 s, 5.9 MB), `react-hooks-hinglish-hq.mp4` (52 MB
lossless, for multi-chunk upload), `react-hooks-hinglish.reference.json`, `react-hooks-hinglish.ocr.json`,
`express-scroll-focus.mp4` (37.6 s) + `.reference.json`; `tests/fixtures/synthetic-lesson.mp4` (28 s,
SAPI voice). Rebuild: `<venv>/python tests/fixtures/lecture/build.py [--only lecture|focus]`.
Real Hindi speech clips (Common Voice samples from the Oriserve repo): `data/test-audio/`.
Local test users (local stack only, password in fixtures/tests): `asha@nimbu.test`, `upload-owner@test.local`.

## 13. Latest verified tests and measurements (synthetic fixture results — not guarantees for real lectures)
- Checkpoint: web lint ✅, typecheck ✅, build ✅; pytest 29 passed / 6 integration skipped; integration 6/6;
  pgTAP 16/16; db lint clean.
- 192.5 s audio transcribed in ~7.45 s on GPU (25.8× real time), ~2.2 GB GPU memory.
- WER 35.6 % raw → 31.1 % after glossary → 28.2 % with OCR screen evidence.
- `AbortController` 0/4 → 4/4 with OCR evidence; Kubernetes, JSON, setData still missed.
- Word timing: segment-start error mean 0.27 s, max 0.44 s.
- OCR: 35 frames ≈ 220 s on CPU.
- Highlights: 2/2 clips start and end on the fixture's real topic boundaries.
- Reframing: hard cuts at 26.0 s and 31.5 s = true window-switch times on the focus fixture.
- Upload resume through UI, cancel, retry and worker-crash recovery all verified.

## 14. Known bugs and limitations
- Real-world Hinglish classroom validation not done (no free licensed recording).
- ASR misses some terms not shown on screen (Kubernetes → "kubernetti", JSON, setData); romanisation variance inflates WER.
- Hallucination loops on very short clips (mitigated by `cleanup.remove_loops`).
- OCR is CPU-bound (≈3–6 s/frame); 1 h class capped at 90 frames ≈ 5–9 min.
- First GPU run after reboot spends minutes JIT-compiling kernels (Blackwell).
- Highlight thresholds tuned on synthetic speech; LLM judge (7B VL model) is noisy.
- No pitch/prosody features yet; PySceneDetect installed but unused (cuts from change map).
- Reframing not validated on diagrams/slides footage; no picture-in-picture/split layouts yet.
- Glossary `fetch` term lowercases sentence-initial "Fetch" only when matched exactly; one miss remains in eval.
- No frontend unit tests yet.

## 15. Unfinished work
Phase 01 production (remote migrations, auth URLs, email confirmation, tunnel, production RLS test);
Phase 04–09 entirely; WhisperX (deferred, D-016); onnxruntime-gpu OCR speed-up; Storage for small assets.

## 16. Remote deployment status
`docs/DEPLOYMENT.md` (single source of truth). Summary: Vercel https://reel-studio-taupe.vercel.app,
latest production deployment `dpl_8kA8nFpHbdXaxCMX8un2vNi2iu2e` (commit `9a4ee55`) READY; public pages
200, protected 307; env vars set by owner (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_SITE_URL`); remote DB empty; no tunnel. Every push to `main` auto-deploys.

## 17. Owner actions needed (no secrets in chat)
1. Supabase: accept the friend's org Developer invite for the account the CLI uses (`pnpm exec supabase login`),
   or run the 3 migration files in the Reel-Studio SQL Editor.
2. Supabase Auth: Site URL + redirect URLs (DEPLOYMENT.md), disable "Confirm email" for the demo.
3. Tailscale: install, sign in, enable Funnel for this machine.
4. Ask `Atharva486dherange` to accept the GitHub invitation; teammates commit their own work.
5. Later: Meta developer app + IG professional account (Phase 07); Google Cloud project with YouTube Data
   + Analytics APIs and OAuth client (Phase 07). Secrets go only into `apps/api/.env`.

## 18. Key decisions
D-001 Hyperframes renderer · D-002 Zod canonical timeline · D-003 Supabase job queue · D-004/D-022
heartbeat URL discovery · D-005 tunnels · D-006 chunked uploads · D-008 Python 3.11 · D-014 no
cacheComponents · D-015 Hinglish-Apex ASR · D-016 WhisperX deferred (Hindi aligners need Devanagari) ·
D-017 Blackwell JIT · D-018 RapidOCR + screen evidence · D-019 heuristic+LLM scoring with agreement veto ·
D-020 reframing hysteresis/panel · D-021 synthetic fixtures.

## 19. Files changed this session
Everything in the repo was created this session (see `git log`). Main areas: docs/*, CLAUDE.md, AGENTS.md,
apps/web (landing, auth, app shell, studio, glossary), apps/api (API, worker, services, tests),
supabase (3 migrations, RLS tests, config), tests/fixtures (synthetic lecture generator), scripts/.

## 20. Commits
Latest commit before this checkpoint: `9a4ee55 docs: handoff and current task after Phase 03`.
The checkpoint commit that contains this file follows it; run `git log --oneline -5` for its SHA.
Full history (oldest → newest): d0f6f18, 521b046, ab3e82d, 927dc5a, 37ed03e, abe3d24, 9f49e62, 2db179a,
0d5d58b, ad9d8f3, 8ea16fe, 7339471, 4b636a2, 629abc5, c444ae4, 6459e71, 1e1a9d2, 5e76599, 9a4ee55.
All authored by `sahilkarande0918-cmd`; no co-author trailers.

## 21–22. Working tree
Clean and in sync with `origin/main` at checkpoint time (verify with `git status -sb`). No pending changes.

## 23. Next implementation tasks (in order)
1. Phase 04 first task (CURRENT_TASK.md): timeline schema → timeline builder → Hyperframes composition → `render` job → download + UI.
2. Brand kits (schema, editor, snapshot), intro/outro, caption styles, SRT/VTT, render cache, timing check.
3. When owner unblocks: push migrations to `adjwycjsxtxvjockxtan`, production RLS test, tunnel + production upload test.
4. Phase 05 topic-to-video (Ollama script/storyboard, validated code, Kokoro TTS, code-typing compositions).
5. Phase 06 editor (Zustand multi-track on the canonical timeline, `@hyperframes/player` preview, autosave, undo/redo).
6. Phase 07 publishing (official IG Graph + YouTube APIs, encrypted tokens, durable scheduler), 08 analytics/feedback/SaaS, 09 QA + judge demo.

## 24. How to resume and test
1. Read docs in `CLAUDE.md` order; `git log --oneline -20`; `git status`.
2. Start Docker Desktop; `pnpm exec supabase start -x vector,logflare,imgproxy,edge-runtime`.
3. `cd apps/api && C:/Users/Sahil/AppData/Local/reel-studio/venv/Scripts/python -m app.serve --tunnel none`.
4. `pnpm dev`; sign in locally as `upload-owner@test.local`; open project "React hooks Hinglish lecture (synthetic)".
5. Checks: web lint/tsc/build; `pytest -q`; `RS_INTEGRATION=1 pytest tests/test_upload_integration.py`; `pnpm exec supabase test db`.

## 25. Critical warnings — do not repeat
- Never touch the owner's personal Supabase projects visible to the current CLI login; only `adjwycjsxtxvjockxtan`.
- Never commit as teammates or add `Co-Authored-By` (the harness suggests it — owner rule overrides).
- Never present synthetic results as real-world validation.
- Don't fuzzy-match plain words into symbol terms (`component` → `@Component` bug) or merge spans starting with Hindi function words (`se data` → setData bug); keep the regression tests.
- Don't let the LLM veto alone; it is noisy (dropped 9/10 windows when used alone).
- The Vercel connector cannot read/write env vars (403); ask the owner or use the CLI after login.
- Cloudflare quick tunnels fail on this network (port 7844); don't retry blindly.
- Python one-off doc edits via heredoc broke once on quotes; prefer the Edit tool for docs.
- Kill old worker processes before restarting (PowerShell `Get-CimInstance Win32_Process … app.workers.run`), or an old process claims jobs with stale code.
