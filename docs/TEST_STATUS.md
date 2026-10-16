# Test status

Only results of commands actually run. Legend: ✅ pass · ❌ fail · ⛔ blocked · ⬜ untested.

## Environment checks (2026-10-16)
| Check | Result | Command |
|-------|--------|---------|
| GitHub CLI auth, admin on repo | ✅ | `gh auth status`; `gh api repos/sahilkarande0918-cmd/Reel-Studio` |
| Collaborator invitations created | ✅ (pending acceptance) | `PUT /collaborators/{user}` → 201 ×3; `GET /invitations` |
| FFmpeg / FFprobe present | ✅ 8.1.2 | `ffmpeg -version` |
| GPU visible | ✅ RTX 5050 8 GB | `nvidia-smi` |
| Ollama API up | ✅ `qwen2.5vl:7b` | `curl localhost:11434/api/tags` |
| `ollama list` CLI | ❌ hung (>5 min); HTTP API works | `ollama list` |

## Phase 01 (2026-10-16)
| Test | Result | Command / method |
|------|--------|------------------|
| API unit tests (health, auth, CORS) | ✅ 5/5 | `pytest` in apps/api |
| RLS isolation (pgTAP) | ✅ 16/16 | `pnpm exec supabase test db` (local stack) |
| Schema lint | ✅ no issues | `pnpm exec supabase db lint --level warning` |
| Web typecheck / lint / build | ✅ | `tsc --noEmit`, `eslint`, `next build` |
| Landing design gate | ✅ 0 FAIL, 1 WARN (no-footage) | taste-skill `inspect.mjs` at 1440/768/390 |
| Signup → onboarding → dashboard | ✅ local | in-app browser against local stack |
| Create project via RLS | ✅ local | in-app browser |
| Signed-out redirect | ✅ | `curl -w %{redirect_url} /dashboard` |
| `/me` real token / tampered token | ✅ 200 / 401 | curl with local-stack session |
| Backend heartbeat + online/offline badge | ✅ local | row fresh in `backend_endpoints`; badge flips after API stop |
| Vercel production pages | ✅ (2026-10-16 checkpoint) | `/`, `/login`, `/signup`, `/forgot-password` 200; `/dashboard`, `/projects`, `/glossary` 307 → login |
| Remote Supabase (migrations, RLS, signup→onboarding on production) | ⛔ blocked | remote project has no tables; CLI cannot access the friend's org |
| Email confirmation + password reset emails | ⬜ | local stack has confirmations off; test on remote |

## Phase 02 (2026-10-16)
| Test | Result | Command / method |
|------|--------|------------------|
| Glossary correction (incl. regression: `component` ≠ `@Component`) | ✅ 6/6 | `pytest tests/test_glossary.py` |
| Repetition-loop cleanup | ✅ 2/2 | `pytest tests/test_cleanup.py` |
| Upload API on local stack (chunks, resume 409, incomplete, fake media, limits, cross-org 404, signed media) | ✅ 6/6 | `RS_INTEGRATION=1 pytest tests/test_upload_integration.py` |
| CTranslate2 on RTX 5050 (Blackwell) | ✅ cuda, float16 | first run 275 s JIT for 28 s audio; warm `base` 1.35 s |
| Worker end to end (claim → audio → ASR → correct → save → ready) | ✅ | `python -m app.workers.run`, job `succeeded`, events extract_audio/transcribe/correct_terms/save |
| Hinglish model (Oriserve Apex, CT2 fp16, lang=hi) on real Hindi speech clips (model-repo Common Voice samples) | ✅ Roman Hinglish output | `tests/bench_asr.py`: "Mehnat to poora karte hain.", "Aap pandrah log hain.", 12.5 s clip in 1.10 s |
| Hinglish model on 28 s synthetic tech-English clip | ✅ ~40× real time warm (0.71 s); cold job 6.4 s incl. model load | worker result `realtime_factor`; terms useEffect/Docker/Kubernetes/JSON/@Autowired correct |
| Known ASR error | ⚠️ "AbortController" → "award controller" | needs screen-OCR evidence (Phase 03) |
| Hallucination loops on 1–3 s clips | ⚠️ observed; mitigated by loop cleanup (raw kept) | bench runs |
| Browser: video playback via signed URL, click-to-seek, search, edit persists after reload | ✅ | in-app browser on local stack |
| Glossary: correct spoken forms only, mishearings not guessed | ✅ 9/9 (glossary + cleanup) | `pytest tests/test_glossary.py tests/test_cleanup.py` |
| **Real Hinglish programming-class recording** | ⛔ none legally obtainable at ₹0 (see below) | |
| WhisperX alignment | ⬜ not implemented (D-016) | |

## Phase 02 acceptance run on the SYNTHETIC lecture (2026-10-16)
Fixture `react-hooks-hinglish`: 192.5 s, 1920×1080 30 fps, Roman-Hinglish narration by Windows OneCore *Ravi (en-IN)*, 14 segments, 62 screen events (typing, edits, pointer, scroll, terminal, browser window). Built by `tests/fixtures/lecture/build.py` with Hyperframes. The reference narration is read only by `tests/eval_transcript.py`, after ASR.

| Step | Result | Evidence |
|------|--------|----------|
| Upload through the app UI (drop on the real uploader) | ✅ | 52 MB lossless copy, 4 × 16 MB chunks |
| Resumable upload | ✅ | page network failed after chunk 2 → UI "keeps failing"; re-drop resumed at offset 33 554 432 (server log), no restart |
| FFprobe metadata | ✅ | 192.5 s, 1920×1080, 30 fps, h264/aac stored |
| FFmpeg audio extraction | ✅ | `extract_audio` stage, 16 kHz mono, loudnorm |
| Local faster-whisper (Hinglish-Apex, CT2 fp16, CUDA) | ✅ | 192.5 s in **7.45 s (25.8× real time)**; GPU memory in use 2.2 GB / 8 GB |
| Hinglish transcription (Roman script) | ✅ with errors | WER raw **35.6%**, corrected **31.1%**; much is romanisation variance (ham/hum, yah/yeh) and TTS mispronunciation ("karte hain" → "kaati hai") |
| Word timestamps | ✅ | 381/381 words start inside the segment being spoken; segment-start error mean **0.27 s**, max 0.44 s |
| Technical terms | ⚠️ partial | correct: useEffect 3/3, React 3/3, API 2/2, Docker, Dockerfile, useState, npm 2/2, replicas · **missed: AbortController 0/4 ("about/Abbot controller"), Kubernetes ("kubernetti"), JSON, setData ("se data"), one sentence-initial "Fetch"** |
| Vocabulary correction | ✅ | 9 corrections applied; mishearings left for OCR evidence (Phase 03) |
| Transcript search | ✅ | "useEffect" → 3 matches |
| Synced playback | ✅ | click "Docker" → video 2:26; active-word highlight follows playback |
| Edit + persistence | ✅ | "kubernetti" → "Kubernetes" saved; raw kept; `{edited, previous}` metadata |
| Cancellation | ✅ | UI Cancel → job `cancelled`, `cancel_requested = true` |
| Retry | ✅ | UI "Retry transcription" → new queued job |
| Worker crash mid-job | ✅ | worker killed during transcribe → job stays `running`, recording `processing`; restarted worker requeued the stale lock after 3 min → attempt 2 `succeeded` (381 words), recording `ready` |

**Real-world validation: unverified.** Spoken Tutorial (IIT Bombay, CC BY-SA 4.0) has Hindi Python screen recordings, but direct file access returns 403 and the official bulk download is now paid (₹99 + GST), which the ₹0 rule forbids. Internet Archive hits were unverifiable YouTube re-uploads; YouTube downloading was not attempted (ToS). A synthetic voice is not equivalent to a real instructor.

## Phase 03 (2026-10-16)
| Test | Result | Evidence |
|------|--------|----------|
| Unit: glossary + cleanup 9, screen correction 4, highlights 3, reframe 7, API 5, misc 1 | ✅ 29 | `pytest` (6 integration tests skipped without RS_INTEGRATION) |
| OCR on lecture (35 frames) | ✅ 220 s CPU | tokens: AbortController, AbortError, setData, useEffect, useState, useFetch … |
| Screen-evidence correction on lecture | ✅ | AbortController 4/4, AbortError fixed, WER 28.2 %; no false merges after guards (setData left uncorrected on purpose) |
| Highlight boundaries vs reference topics (lecture) | ✅ 2/2 starts, 2/2 ends | `tests/eval_highlights.py`; earlier iterations 1/5 → 3/4 → 2/2 recorded in git history |
| LLM judge determinism | ✅ temperature 0, seed 7 | same windows across reruns |
| Reframing on focus fixture | ✅ | cuts at 26.0 s (browser) and 31.5 s (editor) = ground-truth switch times; single panel width |
| Highlights UI | ✅ | select, word-snapped boundary edit, manual crop keyframe persisted (local DB) |
| analyze job timings (lecture) | ✅ | activity 7.3 s, OCR 219.8 s, LLM ~13 s/clip after a ~86 s first load |

## Checkpoint run (2026-10-16, end of session 1)
| Check | Result | Command |
|-------|--------|---------|
| Web lint | ✅ 0 problems | `pnpm lint` (apps/web) |
| Web typecheck | ✅ | `npx tsc --noEmit` |
| Web production build | ✅ 13 routes | `npx next build` |
| API unit tests | ✅ 29 passed, 6 skipped (integration) | `pytest -q` |
| API lint | ✅ | `ruff check .` |
| Upload integration (local stack + API) | ✅ 6/6 | `RS_INTEGRATION=1 pytest tests/test_upload_integration.py` |
| RLS pgTAP | ✅ 16/16 | `pnpm exec supabase test db` |
| DB lint | ✅ no issues | `pnpm exec supabase db lint --level warning` |
| Production probe | ✅ pages / ⛔ data | Vercel `dpl_8kA8nFpH…` READY for `9a4ee55`; remote REST `PGRST205` (no tables) |
| GPU ASR / OCR / LLM benchmarks | not re-run (results above still current) | — |
| Frontend unit tests | ⬜ none exist yet | add Vitest with the timeline schema (Phase 04) |

## Session 2 — infrastructure (2026-10-16)
| Check | Result | Evidence |
|-------|--------|----------|
| Supabase CLI link | ✅ linked to `adjwycjsxtxvjockxtan` (org `yqdlgjynocbxxsmzeesy`) | `supabase/.temp/project-ref`, `linked-project.json` |
| Remote migrations (before owner push) | ⛔ none applied | `supabase migration list --linked`, `inspect db table-stats --linked` (0 rows) |
| Remote migrations (after owner push, 2026-10-17) | 🟡 3/5 applied; `render_jobs` + `explicit_grants` pending | `migration list --linked`; `db push --dry-run` lists the 2 |
| Remote schema | ✅ 14 tables, RLS on 14/14, 26 policies | `supabase db dump --linked --schema public` |
| Remote grants | ❌ `anon` TRUNCATE on 6 tables, `authenticated` TRUNCATE on 14 (fix pending in `…190000`) | same dump |
| Second push by the assistant | ⛔ blocked by the permission classifier | — |
| Remote after second owner push | ✅ 5/5 applied; `anon` 0 table grants, `authenticated` no TRUNCATE, RLS 15/15 | `migration list --linked`; schema dump |
| Backend against production | ❌ `permission denied for table backend_endpoints` and `for function requeue_stale_jobs`: hosted secure-by-default privileges give service_role no DML/EXECUTE | backend log; dump; fix migration `20261017000000` pending owner push |
| RLS pgTAP | ✅ 28/28 | adds service_role RPC + DML assertions (the local stack's defaults hide this class of bug; the assertions guard against grant regressions) |
| Remote after third owner push | ✅ 6/6 migrations | `migration list --linked` |
| Backend on production | ✅ heartbeat row = tunnel URL (age 7 s); table reads OK; `requeue_stale_jobs` 0; `claim_next_job` (probe type) returns empty row; no worker poll failures after the push | service client + worker log |
| External probe against production-configured backend | ✅ run 38950101996: health+CORS, preflight, anon 401, 8 MiB relay, video no-interstitial | GitHub Actions |
| Production auth settings | ✅ signup on · ⚠️ confirm-email on | `/auth/v1/settings` |
| Production signup (owner, after the fix) | ✅ user confirmed via email, onboarding created org + owner membership + audit event | service-client read |
| Production signup (owner, first try) | ❌ "Invalid path specified in request URL": Vercel URL var ends in `/rest/v1/`; base `…/rest/v1` + `/auth/v1/signup` → PGRST125 reproduced, plain origin → GoTrue | probe with backend key, empty body |
| Remote `db push` by the assistant | ⛔ blocked by the session's permission classifier; owner runs it | — |
| Remote auth settings / API keys | ⛔ publishable key from session 1 now returns `Invalid API key`; CLI key listing blocked | `GET /auth/v1/settings` 401 |
| Production signup/login/logout E2E | ⬜ owner must run it (the assistant may not enter passwords or create accounts on a non-local site); needs migrations first | — |
| Tailscale diagnosis | ⛔ network | service Running, CLI 1.104.1 OK, `BackendState: NeedsLogin`; health: "Network equipment from Fortinet may be blocking"; `controlplane.tailscale.com` → `SEC_E_UNTRUSTED_ROOT`; DERP TLS fails |
| Other tunnels from this network | ⛔ | Cloudflare edge reset; pinggy SSH/443 no banner; localhost.run :22 timeout; bore/serveo fail |
| Dev Tunnels host | ✅ | `devtunnel` 1.0.2115 (winget), GitHub login, tunnel `reel-studio.inc1`, `https://j96sqlp6-8000.inc1.devtunnels.ms` |
| Tunnel reachable from the internet | ✅ 200 | check-host.net nodes DE/FR/TR/CA → `/health` 200 |
| Tunnel probe from GitHub Actions (`backend-probe`) | ✅ all steps | run 38944354909: health + CORS for the Vercel origin; preflight OK; anonymous 401; **8 MiB PUT passes the relay** (API 401); `<video>`-style request gets API JSON 403 (no interstitial); navigation gets the interstitial (informational) |
| Same-machine fallback | ✅ | local browser: tunnel `/health` status 0 (TLS intercepted) → `127.0.0.1:8000` 200, badge online |
| Upload integration with 8 MiB chunks | ✅ 6/6 | `RS_INTEGRATION=1 pytest tests/test_upload_integration.py` |
| Default table privileges | ❌→✅ fixed | `authenticated` had TRUNCATE/UPDATE on every table; after `20261016190000_explicit_grants.sql` only the intended grants remain (`information_schema.role_table_grants`) |
| RLS pgTAP | ✅ 24/24 | `pnpm exec supabase test db` (adds render isolation, truncate refused, score edit refused, anon truncate refused, anon holds 0 grants) |
| DB lint | ✅ | `supabase db lint --level warning` |

## Production end to end (2026-10-17, owner's account, owner-supplied recording)
Recording: a 7.5-min Hinglish **physics** class (distance vs displacement), uploaded by the owner. It is real speech, not synthetic, but provenance and licence are unknown to the assistant: it is not committed or redistributed. It is not a programming class, so it does not replace the PS's programming-class validation.
| Step | Result | Evidence |
|------|--------|----------|
| Project create + persists after refresh | ✅ | `projects` row "Existing Lead" (mode recording) |
| Upload through the production site | ✅ | `source_recordings`: 75,273,638 / 75,273,638 bytes, status `ready`, 449.9 s, 1920×1080 29.97 fps h264/aac |
| Transcribe on the local GPU | ✅ | job attempt 1: 449.9 s in **38.8 s (11.6× real time)**, cuda, lang hi, 1,689 words, 15 segments |
| Transcript quality (spot check) | ⚠️ good Roman Hinglish; formula miss | "Hello bachcho aaj badi simple si baat…"; "s = ut + ½at²" heard as "UT plus half **80** square" |
| Analyze | ✅ | 1,970 windows scored, 76 OCR frames in 191 s, 11 screen-term fixes, LLM judged 9 / dropped 3, **6 highlights** of 33–46 s |
| Heartbeat during the run | ✅ | `backend_endpoints` age 5–18 s; earlier `permission denied` lines all predate the service_role grant |

## Phase 04 — first task (2026-10-16, local stack, synthetic lecture)
| Test | Result | Evidence |
|------|--------|----------|
| Timeline schema (Zod) | ✅ 6/6 + tsc | `pnpm test` in `packages/timeline-schema` (defaults, JSON round trip, bad layout, item past end, unknown asset, path traversal, committed JSON Schema in sync) |
| Python timeline + compiler unit tests | ✅ 14/14 (API total 43 passed, 6 skipped) | `pytest tests/test_rendering.py` |
| Hyperframes lint of compiled composition | ✅ 0 errors (16 Studio-editing warnings) | `hyperframes lint --json` |
| Render rank-1 highlight (14.66–61.19 s, manual keyframe) through the UI | ✅ | job `succeeded`, 155 s; ffprobe **1080×1920, 30 fps, H.264 + AAC 48 kHz, 46.533 s vs 46.53 s** |
| Render rank-2 highlight (122.92–173.77 s) | ✅ | ffprobe 1080×1920 30 fps H.264+AAC, **50.867 s vs 50.85 s** |
| Crop follows keyframes | ✅ | frames: 0.2 s panel (manual kf, crop_x 640, window y 363–1173), 4/10/16 s crop layout; 5 s panel, 25 s and 43.6 s crop |
| Captions match corrected words | ✅ | frame 43.6 s: "To **AbortController** vaala pattern abhi zaroori ho" — AbortController in a code chip, highlighted while spoken |
| Crash + retry | ✅ | worker tree killed at 23.6 % render → job stayed `running` → new worker requeued the stale lock after 3 min → attempt 2 succeeded (159 s) |
| Render cache | ✅ | second Render on unchanged highlight → 202, no new row or job |
| Playback / download / signing | ✅ | inline `<video>` 1080×1920 46.53 s plays; download 200 `video/mp4` 5,719,752 B; tampered signature 403 |
| Select-before-render guard | ✅ | unselected highlight shows "Select this highlight to render it", button disabled; API 409 otherwise |
| Known quality limits | ⚠️ | ASR errors pass into captions ("use fish" for useFetch); panel layout code is small (~17 px on 1080 wide); GSAP loaded from jsDelivr during render (needs network) |

## Unverified / untested
Remote Supabase (migrations not applied yet), production auth E2E, email confirmation and password-reset emails, production ↔ backend with a real session. Phase 04 remainder (brand kits, intro/outro, SRT/VTT, timing check) and Phases 05–09.
