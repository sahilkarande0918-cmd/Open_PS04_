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
| Remote Supabase / Vercel production | ⛔ blocked | owner logins required |
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

## Unverified / untested
Phases 03–09. Remote Supabase (migrations not applied), email confirmation and password-reset emails, public tunnel.
