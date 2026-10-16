"""ASR spot-check / benchmark (not a pytest test; run manually on the processing machine).

    python tests/bench_asr.py MODEL_DIR AUDIO [AUDIO ...]

Prints transcript, detected language and speed per file and language setting.
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from app.core.config import get_settings  # noqa: E402
from app.services.transcription import glossary, whisper  # noqa: E402

model_dir, *files = sys.argv[1:]
s = get_settings()
object.__setattr__(s, "whisper_model", model_dir)
g = glossary.Glossary.build()
t = time.perf_counter()
whisper.load()
print(f"model load + warm-up: {time.perf_counter() - t:.1f}s", flush=True)
for f in files:
    for lang in (None, "hi", "en"):
        t = time.perf_counter()
        r = whisper.transcribe(Path(f), hotwords=g.hotwords(), language=lang)
        el = time.perf_counter() - t
        text = " ".join(w["corrected_text"] for w in glossary.correct(r.words, g) if w["corrected_text"])
        print(
            f"[{Path(f).name[:28]} lang={lang or 'auto'}->{r.language}] {el:.2f}s for {r.duration_s:.1f}s audio: {text}",
            flush=True,
        )
