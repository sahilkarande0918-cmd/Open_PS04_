# Reel Studio

**The AI video studio built for technical educators.**
Turn recorded programming classes and one-line topic prompts into branded, ready-to-publish 9:16 reels — with Hinglish-aware transcription, correctly spelled technical terms, and reframing that follows the code instead of cropping the centre.

> Hackathon PS4 · Status: **early development (Phase 00)** — nothing below is claimed as working until it is marked ✅ in [docs/PHASES.md](docs/PHASES.md) and [docs/TEST_STATUS.md](docs/TEST_STATUS.md).

## The problem
Institutes have hundreds of hours of recorded classes and no editor. Generic tools mangle code-mixed Hinglish, misspell `useEffect` and `@Autowired`, and centre-crop screen shares until the code is unreadable.

## What we are building
| Mode | Input | Output |
|------|-------|--------|
| **Recording → Reels** | Long screen-share class recording | Ranked 30–60 s highlights that start and end on complete thoughts, reframed to 9:16 around the active code/cursor/diagram, with word-synced captions and brand kit |
| **Topic → Video** | A topic like `JSON vs XML` | ~45 s explainer: script, code that types and changes on screen, local voiceover, captions, branding |

Both modes share one timeline editor, one renderer (Hyperframes), scheduling/publishing to Instagram and YouTube, analytics, and a feedback loop into highlight ranking.

## Architecture
Next.js on Vercel ↔ Supabase (Auth, Postgres + RLS, Realtime, Storage) ↔ local FastAPI + GPU worker over a free HTTPS tunnel. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Layer | Stack |
|-------|-------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind, Radix, Zustand, TanStack Query |
| Backend | Python 3.11, FastAPI, Pydantic, durable job worker |
| AI / media | faster-whisper, WhisperX, OpenCV, PySceneDetect, local OCR, Ollama, Kokoro TTS, FFmpeg |
| Rendering | Hyperframes (HTML → MP4), `@hyperframes/player` for in-editor preview |
| Data | Supabase Postgres, Auth, Realtime, Storage |

Everything runs at **₹0**: open-source models on local hardware, free tiers only.

## Repository layout
```
apps/web                  Next.js frontend
apps/api                  FastAPI backend + worker
packages/timeline-schema  canonical timeline (Zod → JSON Schema)
packages/video-templates  timeline → Hyperframes composition compiler
supabase/migrations       SQL + RLS
docs/                     architecture, phases, decisions, handoff
```

## Getting started
Setup instructions land with Phase 01. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Team
| GitHub |
|--------|
| [@sahilkarande0918-cmd](https://github.com/sahilkarande0918-cmd) |
| [@sahillokhande5841-cmyk](https://github.com/sahillokhande5841-cmyk) |
| [@Atharva486dherange](https://github.com/Atharva486dherange) |
| [@SK999CodingWorld](https://github.com/SK999CodingWorld) |

## Acknowledgements
Built on [Hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0), [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT), [WhisperX](https://github.com/m-bain/whisperX) (BSD-2), [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) (BSD-3), [Ollama](https://github.com/ollama/ollama) (MIT), [Kokoro](https://github.com/hexgrad/kokoro) (Apache-2.0), FFmpeg, OpenCV and Supabase. Full inventory: [docs/THIRD_PARTY_LICENSES.md](docs/THIRD_PARTY_LICENSES.md).

## Licence
MIT — see [LICENSE](LICENSE).
