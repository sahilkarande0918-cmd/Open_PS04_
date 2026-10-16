# Decisions

Format: ID — decision. *Alternatives* · *Why* · *Trade-off*.

## D-001 — Hyperframes CLI as the only renderer
*Alt:* Remotion (company license needed above a size threshold), raw FFmpeg filter graphs, MoviePy.
*Why:* Mandated; Apache-2.0; HTML/CSS compositions give us code animation, captions, brand intros with one engine; deterministic local render; `@hyperframes/player` previews the same composition in the browser → preview/export parity.
*Trade-off:* Needs Node 22+ and headless Chrome on the render machine; render is slower than a pure FFmpeg trim. Cloud/Lambda render paths are never used (₹0).

## D-002 — Canonical timeline in Zod (`packages/timeline-schema`), JSON Schema for Python
*Alt:* Pydantic as source + generated TS; hand-maintained twin schemas.
*Why:* The editor and the compiler (both TS) are the heaviest consumers. One definition, exported JSON Schema validates Python-generated timelines in tests and at the API boundary.
*Trade-off:* Python sees the timeline as validated JSON rather than rich typed objects.

## D-003 — Jobs live in Supabase Postgres, claimed with SKIP LOCKED via RPC
*Alt:* Redis/RQ, Celery, local SQLite queue.
*Why:* Durable across restarts, already provisioned, Realtime gives free progress streaming to the UI, no extra service to run.
*Trade-off:* Worker depends on internet to Supabase; poll latency ~1–2 s.

## D-004 — Backend URL discovery through Supabase heartbeat
*Alt:* Hard-code tunnel URL in Vercel env (redeploy on every change); paid static tunnel.
*Why:* Free quick tunnels change URL on restart. Backend writes its URL + heartbeat to `backend_endpoints`; frontend reads it and shows a truthful offline state when stale.
*Trade-off:* Extra table; a stale URL window of one heartbeat interval.

## D-005 — Tunnel: Cloudflare quick tunnel (primary), ngrok free static domain (fallback)
*Why:* No account, no bandwidth cap stated for quick tunnels; ngrok free has a monthly data cap that video uploads would exhaust. Cloudflare limits request bodies (~100 MB), so uploads are chunked (D-006).
*Trade-off:* Quick-tunnel URLs are ephemeral and best-effort; documented in DEPLOYMENT.md.
*Update 2026-10-16:* verified that the owner's current network blocks outbound port 7844 (TCP and UDP), which Cloudflare tunnels require (`cloudflared` pre-checks: QUIC FAIL, HTTP/2 FAIL). Added **Tailscale Funnel** (free personal plan, outbound 443 only, stable `*.ts.net` URL) as the second option in `python -m app.serve --tunnel tailscale`. ngrok rejected as default: free plan data-transfer cap is too small for video uploads.

## D-006 — Chunked resumable uploads straight to the local API
*Alt:* tus server, Supabase Storage (1 GB free total, 50 MB per-file limit on Free).
*Why:* Recordings are hundreds of MB; they must land on the GPU machine anyway. Fixed-size chunks with offset resume stay under tunnel body limits.
*Trade-off:* Upload only works while the backend is online (UI says so).

## D-007 — Fold `shared-types` and `ui` packages until a second consumer exists
*Why:* Ponytail/YAGNI — UI components have one consumer (`apps/web`); shared types are the timeline schema. Recreate the packages if a second app appears.

## D-008 — Python 3.11 venv for the backend
*Alt:* System Python 3.13/3.14.
*Why:* CTranslate2 / faster-whisper / WhisperX / PyTorch wheels are most reliable on 3.11; the machine has 3.11 installed.

## D-009 — Local LLM via Ollama, ~7–8B instruct model (Q4)
*Why:* 8 GB VRAM. A Q4 7–8B model (~5 GB) fits when Whisper is unloaded. Models used strictly sequentially. Exact model chosen and licence-checked in Phase 03 (candidates: Qwen2.5-7B-Instruct / Qwen3-8B, Apache-2.0). `qwen2.5vl:7b` already pulled — usable for screen understanding.

## D-010 — TTS via `hyperframes tts` (local Kokoro-82M)
*Alt:* `kokoro` Python package, Kokoro-FastAPI server.
*Why:* Already bundled with the mandated renderer, local, Apache-2.0 weights, no extra service. Kokoro-FastAPI stays an option if we need streaming or more control.

## D-011 — Frontend UI primitives: Radix (via shadcn-style copied components) + Tailwind
*Why:* Accessible primitives, no second UI system, components live in our repo.

## D-012 — Repository licence: MIT
*Why:* Permissive, compatible with all integrated dependencies (Apache-2.0, MIT, BSD). Owner may change before submission.

## D-013 — No AI attribution trailers
The coding harness suggests `Co-Authored-By` trailers; the project owner's explicit rule forbids AI attribution, and owner instructions take precedence. Commits carry only the operator's own identity.

## D-014 — Next.js 16 without `cacheComponents`
*Alt:* keep the template's `cacheComponents` + partial prefetching.
*Why:* Nearly every app route reads the Supabase session; with Cache Components each session read must sit behind Suspense or the build fails. Plain dynamic rendering is simpler and sufficient for an authenticated SaaS. Landing page stays static by default.
*Trade-off:* No static shell for authenticated pages.
