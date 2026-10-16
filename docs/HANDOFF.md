# Handoff

_Last updated: 2026-10-16, Phase 02 in progress; Phase 01 deployment blocked on owner actions._

## Where things are
- Repo: `C:\dev\Reel-Studio` (moved out of OneDrive by fresh clone; old OneDrive copy can be deleted by the owner).
- Python venv: `%LOCALAPPDATA%\reel-studio\venv` (3.11). Converter venv (one-time model conversion): `%LOCALAPPDATA%\reel-studio\convert-venv`.
- Media data: `DATA_DIR=C:/Users/Sahil/AppData/Local/reel-studio/data` (git-ignored, outside OneDrive).
- Local Supabase (Docker): `pnpm exec supabase start -x vector,logflare,imgproxy,edge-runtime`. Both migrations applied locally.
- `apps/web/.env.local`, `apps/api/.env` point at the LOCAL stack.

## Verified
- Phase 01 locally (see TEST_STATUS). Production: Vercel build READY but runtime 500 (env vars missing); remote Supabase empty.
- Phase 02: upload API integration 6/6, glossary 5/5, pgTAP 16/16, web lint/typecheck clean.

## Blocked on owner
1. Vercel env vars + redeploy (DEPLOYMENT.md).
2. Supabase CLI access to friend's org or manual SQL in the Reel-Studio SQL editor; Auth URL config; disable email confirmation for demo.
3. Tunnel: Cloudflare blocked on current network → install Tailscale + enable Funnel, or use a network that allows TCP 7844.
4. A real Hinglish programming class recording (2–10 min) for the Phase 02 acceptance test.

## In flight
- `requirements/ml.txt` install (faster-whisper + CUDA 12 cuBLAS/cuDNN wheels) into the main venv.
- CTranslate2 conversion of `Oriserve/Whisper-Hindi2Hinglish-Apex` (Apache-2.0, large-v3-turbo based) → set `WHISPER_MODEL` to the output dir.

## Next actions
1. Verify faster-whisper on the RTX 5050 (CUDA, float16), fall back to int8_float16/CPU if needed.
2. Run worker on the synthetic fixture and the Oriserve sample Hindi clips; then on the owner's real recording. Record WER-style spot checks and real-time factor in TEST_STATUS.
3. Browser-test upload → progress → transcript → click-to-seek → edit persistence.
4. WhisperX alignment (optional, needs torch cu128) — document if skipped.
5. Phase 03: audio energy/pauses, PySceneDetect + OpenCV activity, highlight candidates, reframing.
