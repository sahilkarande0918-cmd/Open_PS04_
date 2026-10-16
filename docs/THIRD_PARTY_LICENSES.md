# Third-party inventory

Reviewed 2026-10-16 via GitHub API (licence SPDX, archived flag, last push). Re-check before release.

## Integrated / planned runtime dependencies

| Project | Licence | Status | Use in Reel Studio |
|---------|---------|--------|--------------------|
| heygen-com/hyperframes (CLI v0.8.164, `@hyperframes/player`) | Apache-2.0 | active | Principal renderer; editor preview player; local Kokoro TTS (`hyperframes tts`) |
| SYSTRAN/faster-whisper | MIT | active | Speech recognition with word timestamps |
| m-bain/whisperX | BSD-2-Clause | active | Word-level forced alignment (where reliable) |
| Breakthrough/PySceneDetect | BSD-3-Clause | active | Scene-change detection |
| OpenCV (opencv-python) | Apache-2.0 | active | Frame analysis, motion, region tracking |
| ollama/ollama | MIT | active | Local LLM runtime |
| hexgrad/kokoro (Kokoro-82M weights) | Apache-2.0 | active | Local TTS voice model (via Hyperframes) |
| remsky/Kokoro-FastAPI | Apache-2.0 | active | Optional TTS server — not adopted yet (D-010) |
| FFmpeg 8.1 (gyan.dev full build) | GPL-3.0 build (LGPL core) | system binary | Media extraction/transcode; invoked as a separate process, not linked |
| Next.js / React | MIT | — | Frontend |
| Tailwind CSS | MIT | — | Styling |
| Radix UI primitives | MIT | — | Accessible primitives |
| Zustand | MIT | — | Editor state |
| TanStack Query | MIT | — | Request state |
| Lucide | ISC | — | Icons |
| Zod | MIT | — | Canonical timeline schema |
| FastAPI / Pydantic / Uvicorn | MIT / MIT / BSD-3 | — | Backend |
| supabase-js / @supabase/ssr / supabase-py | MIT | — | Supabase clients |

LLM weights (Qwen family candidates) — licence verified per exact model in Phase 03 before use.

## Engineering / design tooling (not shipped)

| Project | Licence | Notes |
|---------|---------|-------|
| DietrichGebert/ponytail | MIT | Installed Claude Code plugin; mandatory review/audit discipline |
| Leonxlnx/taste-skill | MIT | Design direction skill |
| Nutlope/hallmark | MIT | Design audit skill (installed) |
| 21st-dev/magic-mcp | ISC | Optional; not enabled — hosted generation may not be free (Section 5.5) |
| unovue/inspira-ui | MIT | Reference only (Vue) — no Vue runtime added |

## Editor references

| Project | Licence | Decision |
|---------|---------|----------|
| OpenCut-app/opencut-classic | MIT, **archived** | Reference for timeline interaction patterns; any copied code keeps its MIT notice |
| opencutvideo/Opencut | **No licence file** | Do not copy code (all rights reserved by default) |
| openvideodev/react-video-editor | **NOASSERTION (custom)** | Do not adopt; custom licence terms not verified for our use |

Decision: custom React timeline (D-011/Phase 06), built on permissive primitives only.

## Social integration references

| Project | Licence | Notes |
|---------|---------|-------|
| adelaidasofia/instagram-mcp | MIT | Reference for official Graph API flow; review token handling before reuse |
| Burak-cell-max/instagram-mcp-panel | MIT | Scheduling-panel reference; 0 stars, very new — read-only reference |

## Notices
Hyperframes (Apache-2.0) requires preserving its LICENSE/NOTICE if we redistribute its code. We consume it as an npm dependency; attribution is listed in README.
