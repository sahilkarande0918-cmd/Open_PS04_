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

## Unverified / untested
Everything in Phases 01–09.
