# Current task

## Phase 04 — Captions, Branding and Hyperframes MP4 Rendering (next; not started)

**Objective:** take a *selected* highlight from Phase 03 and produce a real, professional, branded
1080×1920 MP4 that plays the source clip through its crop keyframes, with word-synchronised captions
(technical terms spelled correctly, code shown as formatted text) and the institute's brand.

### First implementation task (do this first)
**Render one selected highlight → MP4, end to end, without brand kits yet.**

1. `packages/timeline-schema` (new pnpm package): Zod schema + TS types for the canonical timeline
   (`Composition {id, schemaVersion: 1, fps, width: 1080, height: 1920, duration, tracks[], assets{}, brand, renderSettings}`;
   `Track {id, kind: video|audio|caption|text|overlay, items[]}`; `VideoItem {assetId, start, duration, sourceStart, sourceEnd, cropKeyframes[]}`;
   `CaptionItem {words[{text,start,end,isCode}] , style}`), plus `scripts/export-json-schema` writing
   `timeline.schema.json` for Python. Add Vitest with serialization/validation tests.
2. `apps/api/app/services/rendering/timeline.py`: build a canonical timeline from a `highlight_candidates`
   row + its transcript words (corrected_text, times shifted by `start_s`; drop merged/blank words) +
   `crop_keyframes`. Validate against `timeline.schema.json` (`jsonschema`).
3. `packages/video-templates` (or `apps/api/app/services/rendering/compose.py` if a Node package is overkill —
   decide with Ponytail): compile the timeline to a Hyperframes `index.html`:
   - `<video>` of the source (`data-start=0`, trimmed to `sourceStart..sourceEnd` — see Hyperframes
     `variables-and-media.md` for trimming/`data-has-audio`), positioned per keyframe with GSAP on the
     **main** timeline (`crop` layout = full-height 9:16 window; `panel` layout = scaled to 1080 wide over a
     blurred/dimmed copy of the frame); `cut` keyframes use `tl.set`, others tween.
   - word-by-word captions in the lower safe zone (~y 1350–1650), current word highlighted, `isCode`
     words in a monospace chip; line breaking ≤ 2 lines, ≤ ~32 chars/line.
   - follow `hyperframes-core` rules: one paused timeline at `window.__timelines["main"]`, no CSS transform
     + GSAP conflicts, `<audio>`/`<video>` with `id`, no `crossorigin`, `@font-face` for named fonts.
4. Worker job `render` (`app/workers/render.py`): stage project dir under
   `DATA_DIR/orgs/<org>/renders/<render_id>/` (copy or symlink the source), run
   `npx --yes hyperframes@0.8.164 lint` then `render --quality looks --output out.mp4`
   (env `HYPERFRAMES_TELEMETRY=0 DO_NOT_TRACK=1`), verify with ffprobe (1080×1920, duration ≈ clip
   duration ± 0.1 s, audio present), make a thumbnail, store a `render_jobs`/`export_assets` row (new migration).
5. API `POST /highlights/{id}/render`, `GET /renders/{id}/download-url` (HMAC-signed like media);
   UI: "Render" button on a selected highlight, real progress, download link, inline `<video>` of the result.

**Inputs available now:** local stack has recording `0ba5238f-0c10-49e7-86a3-83b5255f91d2`
(project `10fb1100-8c9c-41ba-9f82-33f5ed4d0888`, user `upload-owner@test.local`) with a *selected*
highlight (rank 1, 14.66–61.19 s, manual crop keyframe) and transcript `7c1574d7-e6ec-4db5-9d5d-97537e5b4883`.
Source file under `DATA_DIR/orgs/7d612534-293d-492e-95d1-e87856829346/recordings/0ba5238f-…/source.mp4`.

**Files to read first:** `apps/api/app/workers/analyze.py`, `app/services/screen_analysis/reframe.py`
(keyframe shape), `apps/web/components/studio/highlights.tsx` (`cropAt` — preview must match render),
`supabase/migrations/20261016160000_highlights.sql`, `tests/fixtures/lecture/screen.html` (a working
Hyperframes composition with audio + GSAP clock), Hyperframes skill docs (`hyperframes-core`,
`hyperframes-cli`, `embedded-captions`).

**Acceptance for the first task:** an MP4 from the selected highlight exists, ffprobe shows
1080×1920 30 fps H.264 + AAC with duration within 0.1 s of the clip; frames at 3 timestamps show the
crop following the keyframes (incl. the manual one) and captions matching the corrected words at
those times (`AbortController` spelled correctly); the job shows real progress and survives a retry.

### Then (rest of Phase 04)
Brand kits (table + editor UI + snapshot per render: colours, fonts, logo, intro/outro, handle,
watermark, caption style presets), intro/outro sub-compositions, SRT/VTT export, quality presets
(draft/looks/delivery), render cache keyed by timeline hash (boundary edit → only re-render), timing
consistency check (caption word times vs audio), thumbnails. Phase 04 acceptance in `docs/PHASES.md` / master prompt.

## Parallel, blocked on the owner (keep visible)
1. **Supabase production:** CLI cannot see the friend's org. Owner accepts the Developer invite for the
   CLI account (or runs the 3 migration files in the Reel-Studio SQL Editor), sets Auth URL config,
   disables "Confirm email" for the demo. Then: link `adjwycjsxtxvjockxtan`, `db push`, verify RLS and
   signup → onboarding → project on https://reel-studio-taupe.vercel.app.
2. **Public tunnel:** Cloudflare blocked (port 7844). Owner installs Tailscale, signs in, enables Funnel;
   then `python -m app.serve --tunnel tailscale`, set `ALLOWED_ORIGINS` to include the Vercel domain,
   verify upload/job status from production.
3. Teammate `Atharva486dherange` has not accepted the GitHub invitation yet.
