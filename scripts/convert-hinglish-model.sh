#!/usr/bin/env bash
# Converts the official Oriserve/Whisper-Hindi2Hinglish-Apex weights (Apache-2.0) to CTranslate2
# for faster-whisper. One-time; needs a venv with torch (CPU is fine), transformers and ctranslate2.
#   CONVERT_PY=path/to/convert-venv/python  OUT=path/to/models/hinglish-apex-ct2  scripts/convert-hinglish-model.sh
set -euo pipefail
: "${CONVERT_PY:?set CONVERT_PY}" "${OUT:?set OUT}"
"$CONVERT_PY" -m ctranslate2.converters.transformers \
  --model Oriserve/Whisper-Hindi2Hinglish-Apex \
  --output_dir "$OUT" \
  --copy_files tokenizer.json preprocessor_config.json \
  --quantization float16 --force
echo "Set WHISPER_MODEL=$OUT in apps/api/.env"
