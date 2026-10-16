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

## Phase tests
None yet.

## Unverified / untested
Everything in Phases 01–09.
