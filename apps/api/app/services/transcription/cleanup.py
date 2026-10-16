"""Remove Whisper repetition loops from the displayed transcript.

Whisper-family models sometimes loop at the end of a speech region ("aap to aap to aap to aap",
"Acko. Acko. Acko."). A phrase repeated 3+ times back to back is collapsed to its first occurrence.
Only corrected_text is blanked; raw_text stays as recognised and the word is marked in metadata,
so the change is visible and reversible.
"""

import re

MAX_N = 4  # longest repeated phrase (in words) we look for
MIN_REPEATS = 3  # "haan haan" (2) is real speech; 3+ identical phrases in a row is a loop


def _key(w: dict) -> str:
    return re.sub(r"[^\w@#+]", "", w["raw_text"].lower())


def remove_loops(words: list[dict]) -> list[dict]:
    out = [{**w, "metadata": dict(w.get("metadata") or {})} for w in words]
    keys = [_key(w) for w in out]
    i = 0
    while i < len(out):
        collapsed = False
        for n in range(1, MAX_N + 1):
            phrase = keys[i : i + n]
            if len(phrase) < n or not all(phrase):
                continue
            reps = 1
            while keys[i + reps * n : i + (reps + 1) * n] == phrase:
                reps += 1
            if reps >= MIN_REPEATS:
                for j in range(i + n, i + reps * n):
                    out[j]["corrected_text"] = ""
                    out[j]["metadata"]["removed"] = "repetition-loop"
                i += reps * n
                collapsed = True
                break
        if not collapsed:
            i += 1
    return out
