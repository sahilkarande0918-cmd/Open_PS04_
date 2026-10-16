# Current task

**Next: Phase 04 — captions, branding, Hyperframes rendering** (render a selected highlight to a branded 9:16 MP4 using its crop keyframes and word-timed captions).

Phase 02 and 03 pass on synthetic fixtures (TEST_STATUS). Still blocked on the owner:
1. Supabase CLI access to the friend's org (or run the 3 migration files in the Reel-Studio SQL editor), Auth URL config, disable email confirmation for the demo.
2. Tailscale install + Funnel for the public tunnel (Cloudflare is blocked on this network).

Phase 04 plan: `packages/timeline-schema` (Zod canonical timeline + JSON Schema) → timeline compiler to Hyperframes HTML (source video crop via keyframes, panel layout over blurred background, word-by-word captions with code terms as formatted text, brand intro/outro) → render job → export assets → editor preview with `@hyperframes/player`.
