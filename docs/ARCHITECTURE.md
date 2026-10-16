# Architecture

## Overview

```
 Browser (judge / institute user)
   │  HTTPS
   ▼
 Vercel (Hobby) — apps/web  Next.js App Router
   │  • UI, auth session (Supabase SSR cookies)
   │  • reads/writes app data directly via Supabase (RLS-enforced)
   │  • never touches large media or GPU work
   │
   ├──────────────► Supabase (Free)
   │                 • Auth (email/password, optional OAuth)
   │                 • Postgres (all metadata, RLS by organization)
   │                 • Realtime (job progress)
   │                 • Storage (logos, thumbnails, selected final MP4s, signed URLs)
   │
   └── HTTPS tunnel ─► Local machine (owner's laptop, RTX 5050 8 GB)
                        apps/api  FastAPI  (JWT-verified, CORS-restricted)
                          • chunked upload → data/ (local disk)
                          • enqueue jobs (rows in Supabase `jobs`)
                        worker  (same codebase, separate process)
                          • claims jobs with SKIP LOCKED via RPC
                          • FFmpeg / faster-whisper / OpenCV / OCR / Ollama
                          • Hyperframes CLI render (Node 24 + headless Chrome)
                          • scheduler loop for publish jobs
```

The backend registers its current public tunnel URL in Supabase (`backend_endpoints`) on startup and
heartbeats it. The frontend reads it, so a changing quick-tunnel URL does not require a redeploy, and
the UI shows a truthful "processing backend offline" state when the heartbeat is stale.

## Monorepo

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js frontend (all 18 product pages) |
| `apps/api` | FastAPI app + worker (`app/workers`) + services |
| `packages/timeline-schema` | **Canonical timeline** — Zod schema, TS types, generated JSON Schema, migrations |
| `packages/video-templates` | Timeline → Hyperframes HTML compiler; brand intro/outro, captions, code-animation blocks |
| `supabase/migrations` | Version-controlled SQL + RLS |
| `data/` (git-ignored) | Raw recordings, intermediates, renders, caches |

`packages/shared-types` and `packages/ui` from the master-prompt sketch are folded into
`timeline-schema` and `apps/web/components/ui` until a second consumer exists (see DECISIONS D-007).

## Data flow — Mode A (Recording → Reels)

1. **Upload**: browser → `POST /uploads` (chunked, resumable) → `data/orgs/<org>/recordings/<id>/source.<ext>`.
2. **Ingest job**: ffprobe validation (real media, duration, dimensions, size) → row in `source_recordings`.
3. **Audio**: FFmpeg → 16 kHz mono WAV, loudness-normalized.
4. **Transcribe**: faster-whisper (word timestamps) → optional WhisperX alignment → `transcripts`/`transcript_words` (raw text kept).
5. **Vocabulary correction**: dictionary + org glossary + OCR tokens from screen → `corrected_text` per word (raw preserved).
6. **Audio features**: RMS energy, pauses, speech rate, pitch variation per window.
7. **Screen analysis**: PySceneDetect cuts + sampled-frame OpenCV diffs → activity map, active-region boxes, OCR text regions.
8. **Highlights**: sentence/thought segmentation → candidate windows 30–60 s snapped to sentence boundaries + pauses → features → heuristic score (labelled) + Ollama completeness/usefulness judgment → dedupe → ranked `highlight_candidates` with reasons.
9. **Reframe**: per candidate, active-region track → smoothed 9:16 crop keyframes (`crop_keyframes` in the timeline) with layout mode (crop / code-panel / split / PiP).
10. **Timeline**: AI builds a canonical timeline (video clip + crop keyframes + captions + brand snapshot).
11. **Edit**: editor loads timeline; preview uses `@hyperframes/player` on the compiled composition.
12. **Render job**: compile timeline → Hyperframes project dir → `hyperframes render` → MP4 → ffprobe verify → thumbnail → `export_assets` (optional upload to Storage).

## Data flow — Mode B (Topic → Video)

topic + options → Ollama outline/script/storyboard (structured JSON) → code examples validated
(JSON/XML/etc parsed; executable snippets only in sandboxed validators) → Kokoro TTS per scene
(`hyperframes tts`) → word timings (faster-whisper on the TTS audio, aligned to known script text) →
canonical timeline (code-typing blocks, captions, brand) → same render path as Mode A.

## Canonical timeline (one format everywhere)

Defined once in `packages/timeline-schema` (Zod). Used by: AI generation (Python emits JSON validated
against the generated JSON Schema), the editor (Zustand store), preview (compiled composition),
export (same compiler), persistence (`timelines.document` jsonb + `timeline_revisions`).
Every document carries `schemaVersion`; `migrate()` upgrades old documents.

Core shape (abridged): `Composition { id, schemaVersion, fps, width, height, duration, tracks[], assets{}, captions, brand (snapshot), renderSettings }`,
`Track { id, kind: video|audio|text|caption|overlay, items[] }`,
`Item { id, assetId?, start, duration, sourceStart?, sourceEnd?, transform{x,y,scale,crop}, cropKeyframes?, effects[], keyframes[], audio{gain,fadeIn,fadeOut}, ai? }`.

## Jobs

`jobs` table (Section 18 contract: job_id, organization_id, project_id, job_type, status, progress,
current_stage, error, created_at, updated_at, + attempts, locked_at, locked_by, payload, result).
Worker claims via `claim_next_job()` (FOR UPDATE SKIP LOCKED), heartbeats, and on restart re-queues
jobs whose lock expired — it never marks unfinished work as complete. Stages are idempotent and cache
their outputs under `data/cache/<hash>` so a boundary edit re-runs only compile + render.
GPU concurrency = 1 heavy model at a time (transcribe / LLM / render are serialized).

## Rendering pipeline

`timeline.json` → `packages/video-templates` compiler (Node) → `index.html` + assets (symlinked media,
brand fonts, logo) → `npx hyperframes check` → `npx hyperframes render --quality <draft|looks|delivery>`
→ `ffprobe` duration/fps check → thumbnail via FFmpeg. Hyperframes telemetry is disabled.

## Publishing & analytics

`publish_jobs` (scheduled UTC + tz, state machine scheduled→processing→publishing→published|failed|cancelled,
attempts, idempotency key, platform post id). Worker scheduler claims due jobs with locking.
Instagram: official Graph API (Reels container → poll → publish) using a short-lived signed Storage URL.
YouTube: Data API v3 resumable upload; Analytics API for metrics. Tokens AES-GCM-encrypted server-side.
Metrics → `platform_metrics` snapshots → normalized → feature comparison → `feedback_recommendations`
(ranking weight deltas with explanations, minimum-data thresholds).

## Security boundaries

- Browser ↔ Supabase: publishable key + user JWT; RLS by `organization_members`.
- Browser ↔ local API: user JWT verified against Supabase JWKS; org membership checked server-side.
- Local API ↔ Supabase: secret key, backend only.
- FFmpeg/Hyperframes invoked with argument lists; file paths generated server-side, never from user strings.

## Deployment

See `docs/DEPLOYMENT.md`. Vercel builds `apps/web` only. The local API + worker run on the owner's
machine and are exposed through a free HTTPS tunnel.
