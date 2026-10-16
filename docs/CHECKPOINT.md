# Reel Studio — latest checkpoint (2026-10-17, Claude, after the Codex handoff)

**Read this first after compaction.** It supersedes older status lines in other docs (not the requirements).
Then read `CLAUDE.md`, `docs/CODEX_TO_CLAUDE_HANDOFF.md` (Codex detail, still valid except where corrected here),
`docs/CURRENT_TASK.md`, `docs/TEST_STATUS.md`, `docs/DEPLOYMENT.md`. `ORIGINAL_PS.md` and `MASTER_PROMPT.md` are unchanged.

## 1. Objective and scope
Hackathon PS4 "Reel Studio": technical educators turn (A) Hinglish class recordings into branded 30–60 s 9:16 reels and
(B) a topic (e.g. "JSON vs XML") into a ~45 s narrated code explainer; shared rendering, editor, publishing, analytics.
Rules: ₹0, no fake features, no AI attribution (no co-author trailers), commits only as `sahilkarande0918-cmd`,
only Supabase project `adjwycjsxtxvjockxtan`, never the owner's personal SaaS project, never disable RLS, no secrets in git/chat.

## 2. Priorities (owner, 2026-10-17, D-035)
1. Finish and polish both video modes. 2. Professional SaaS UI (reference screenshots = structure only, not colours/theme).
3. Fully functional multitrack editor (trim, split, captions, audio, overlays, preview, undo/redo, autosave, re-render).
4. Instagram Business connection, automatic publishing, scheduling. 5. Real Instagram analytics + AI performance feedback.
6. End-to-end testing and submission. **YouTube postponed** until the owner explicitly asks. Billing, complex admin and
non-essential optimisation postponed. Keep auth, RLS, protected endpoints, encrypted OAuth tokens. Owner wants speed:
skip non-essential tests/steps; ask only for account access, credentials, real publishing or external actions.

## 3. Phase status
| Phase | Status |
|---|---|
| 00 Foundation | ✅ |
| 01 Auth/DB/deploy | ✅ production signup/confirm/onboarding/project/upload verified; second-account RLS check on prod not done |
| 02 Ingestion + Hinglish ASR | ✅ synthetic-verified; owner's real 7.5-min physics class transcribed on production |
| 03 Highlights + reframing | ✅ synthetic-verified; real physics class analysed on production (6 highlights) |
| 04 Captions/branding/render | ✅ synthetic-verified (brand kits, intro/outro, watermark, 3 caption presets, positions, SRT/VTT, timing check, subtitle preview); a production render from the owner's account not yet done |
| 05 Topic → Video | ✅ **works end to end via the UI** (see §6); open polish items below |
| 06 Editor | ⬜ schema/compiler groundwork only (Codex); no editor UI |
| 07 Instagram publishing | 🟡 OAuth + queue + worker built (Codex); Business account not connected; nothing published |
| 08 Analytics/feedback | 🟡 insights worker + page scaffold (Codex); no real metrics; AI feedback not started |
| 09 Submission | ⬜ |

## 4. Work since the Codex handoff (commits `baa13e8`, `fe984a0`)
Root cause of the Mode B failure was not only fences: **Ollama 0.30.6 ignores `format` entirely** when the JSON schema has
`$ref` or min/max length keywords (bisected live), so the model wrote prose/fenced/invented keys.
- `apps/api/app/services/generation/storyboard.py`: `ollama_schema()` inlines `$defs` refs and drops
  minLength/maxLength/minItems/maxItems (Pydantic still enforces them); `unwrap_fence()` strips exactly one full-reply
  Markdown fence (prose, two blocks, unterminated → still rejected); `quality_issues()` gates feed the repair loop:
  word count 75–130 % of `duration × 2.8` (measured Kokoro speed), not every scene the same code, ≤1 `text` scene,
  no generic titles; repairs use temperature 0.4 / new seed. Prompt asks for one format per scene and progressing examples.
- `apps/api/app/services/generation/narration.py`: `align_words()` drops stray recognised words, splits unequal spans
  by word length, gives a missed word only its measured neighbour gap; rejects scenes with <85 % recognised words.
- `apps/api/app/services/rendering/compose.py`: code panel enlarged (y 300–1200, 46 px code, centred), readable on phones.
- Tests: `tests/test_fenced_json.py` (new), `tests/test_generation.py` (xfail removed, quality + alignment tests).
- Docs: priorities (CURRENT_TASK, PHASES, D-035), TEST_STATUS "Phase 05 — Mode B live".

## 5. Verified results (actually run)
- Backend: pytest **88 passed, 6 skipped** (integration), ruff clean — at `fe984a0`.
- Live Mode B through Topic Studio on the **local** stack (job attempt 1): "JSON vs XML" → storyboard 5 scenes
  (json/xml), Kokoro narration, render → ffprobe **1080×1920, 30 fps, H.264 + AAC, 46.77 s**, 2.5 MB, audio peak −2.5 dB.
  In the UI the inline player plays (1080×1920, 46.77 s) and **Download MP4 → HTTP 200**; SRT/VTT buttons present.
- Code-card enlargement checked on a **draft re-render of the same timeline** (frames at 5 s and 20 s), not a new generation.
- **Not verified:** the prompt change against repeated JSON (4 of 5 scenes reused one object in the verified video) — needs
  one new full generation. Mode B not yet run on **production** (owner's account). Frontend checks were not rerun this
  session (no frontend changes since Codex's passing run). pgTAP not rerun (no DB changes).

## 6. Known bugs and limitations
- Mode B: repeated example code (fix untested); Topic Studio shows raw errors (`ValueError: …`); storyboard is read-only
  (no edit/approve step); Fira Code ligature turns `</` into a glyph (consider disabling ligatures for XML).
- First storyboard ~40 s; narration ~30 s; render ~2–3 min per 45 s video. Ollama must be running (`ollama serve`).
- ASR model is the Hinglish model also used for English TTS timing (works; occasional mishearings handled by alignment).
- Real programming-class recording still unavailable (synthetic + real physics class only).
- On the owner's Fortinet network the tunnel URL is TLS-intercepted; the app falls back to `http://127.0.0.1:8000` there.

## 7. UI and editor
Codex redesign (evergreen/ivory tokens, sidebar, dashboard, projects, Topic Studio, Publishing, Analytics) is in place and
deployed; full responsive review and remaining screens are open (priority 2). Editor: not built (priority 3).

## 8. Instagram (Codex implementation; status unchanged this session)
- Official Instagram API with Instagram Login, Meta app **Reel Studio-IG**; scopes `instagram_business_basic`,
  `instagram_business_content_publish`. Credentials names in ignored `apps/api/.env`: `INSTAGRAM_CLIENT_ID`,
  `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI` (= `https://reel-studio-taupe.vercel.app/publishing/callback/instagram`),
  `TOKEN_ENCRYPTION_KEY` (do not regenerate).
- Implemented + unit/DB-tested: connect endpoint with hashed single-use state, callback exchange → long-lived token →
  AES-256-GCM encrypted storage, publish worker (MP4 checks, signed URL, container, poll, publish, `needs_review` on
  ambiguity, dedupe), insights worker, Publishing/Analytics pages. Shared media-signing key (API+worker) — both restarted
  this session, so signed URLs now verify across processes.
- **Not done:** Business account OAuth (owner must log into the separate Business account in an isolated Chrome profile/
  incognito, sign into Reel Studio there at `/publishing`, click Connect Instagram, verify the username before consent);
  real token/scopes/expiry; real container/publish; real insights (`instagram_business_manage_insights` not requested yet).
- **Never** connect/convert/publish to personal `@sahil_karande`. **No post published; publish only with explicit owner approval.**
- YouTube: postponed (config names exist, no code).

## 9. Infrastructure
- Vercel `prj_VVWevgFfCwq7LgQauMu1B11RGzua`, https://reel-studio-taupe.vercel.app — `fe984a0` deployment **success**;
  `/` and `/login` 200, `/dashboard` 307.
- Supabase `adjwycjsxtxvjockxtan`: migrations through `20261017040000_social_publishing` applied (Codex applied 03/04).
- Backend (this machine): production stack `python -m app.serve --tunnel devtunnel` on :8000 → tunnel
  `https://j96sqlp6-8000.inc1.devtunnels.ms`, heartbeat fresh, **restarted with `fe984a0` code**. Local test stack on :8001
  against the local Supabase (Docker) with env overrides. Local web dev server :3000. Ollama `serve` running (qwen2.5vl:7b).
  PIDs change on restart; find them with `Get-CimInstance Win32_Process` filtered on `app.serve`.

## 10. Commands and paths
- Repo `C:\dev\Reel-Studio` (OneDrive copies obsolete). Venv `C:\Users\Sahil\AppData\Local\reel-studio\venv`.
  Data `C:\Users\Sahil\AppData\Local\reel-studio\data` (renders under `orgs/<org>/renders/<id>/`).
- Prod backend: `cd apps/api && <venv>\Scripts\python -m app.serve --tunnel devtunnel`.
- Local backend: `SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status -o env> PUBLIC_API_URL=http://127.0.0.1:8001 python -m app.serve --tunnel none --port 8001`.
- Local Supabase: start Docker Desktop, `pnpm exec supabase start -x vector,logflare,imgproxy,edge-runtime`.
- Local test login: `upload-owner@test.local` (password in `apps/api/tests/test_upload_integration.py`); topic project
  "JSON vs XML explainer" `a247cf7b-06e0-4499-8991-b0dd16f7b62d`, verified render `95d94b51-5c3b-4405-8b5c-e1b36c6c913b`.
- Tests: `cd apps/api && <venv>\Scripts\python -m pytest -q`; web `pnpm lint && npx tsc --noEmit`; DB `pnpm exec supabase test db`.
- Restart BOTH API and worker together after backend code changes (the launcher does both).

## 11. Pending owner actions
1. Instagram Business-account OAuth in an isolated browser session (see §8). 2. Approve any real test post explicitly.
3. Provide UI reference screenshots when the redesign starts. 4. Teammate Atharva486dherange GitHub invite (still pending earlier).

## 12. Git
Branch `main`; checkpoint commits after `fe984a0` are docs only. Work tree clean at checkpoint start; no uncommitted code.

## 13. Next steps (in order)
1. One new full Mode B generation to verify the repeated-code prompt fix; friendlier Topic Studio errors.
2. UI redesign (priority 2). 3. Phase 06 editor. 4. Instagram OAuth with the Business account, then a test publish on approval.
5. Insights + AI feedback. 6. E2E and submission.
