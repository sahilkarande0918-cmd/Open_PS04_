"""Evaluate a stored transcript against a fixture's reference narration (manual tool).

    python tests/eval_transcript.py TRANSCRIPT_ID path/to/<name>.reference.json

Reports: word error rate (raw ASR and corrected), technical-term accuracy, and how many recognised
words fall inside the reference segment that was actually being spoken at that time.
The reference is only read here, after transcription; it is never given to the ASR.
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from app.core.db import service_client  # noqa: E402

TERMS = [
    "useEffect",
    "AbortController",
    "fetch",
    "React",
    "API",
    "Docker",
    "Kubernetes",
    "JSON",
    "useState",
    "setData",
    "npm",
    "Dockerfile",
    "replicas",
]


def norm(text: str) -> list[str]:
    return re.sub(r"[^\w@#+ ]", " ", text.lower()).split()


def wer(ref: list[str], hyp: list[str]) -> float:
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r != h))
    return d[-1] / max(len(ref), 1)


def words_of(tid: str) -> list[dict]:
    db, out = service_client(), []
    for start in range(0, 100_000, 1000):
        page = (
            db.table("transcript_words")
            .select("idx,start_s,end_s,raw_text,corrected_text")
            .eq("transcript_id", tid)
            .order("idx")
            .range(start, start + 999)
            .execute()
            .data
        )
        out += page
        if len(page) < 1000:
            return out
    return out


def main(tid: str, ref_path: str) -> None:
    ref = json.loads(Path(ref_path).read_text(encoding="utf-8"))
    ws = words_of(tid)
    raw = " ".join(w["raw_text"] for w in ws)
    cor = " ".join(w["corrected_text"] for w in ws if w["corrected_text"])
    ref_words = norm(ref["full_text"])
    print(f"reference words: {len(ref_words)}   recognised words: {len(ws)}")
    print(f"WER raw ASR:       {wer(ref_words, norm(raw)):.1%}")
    print(f"WER after correct: {wer(ref_words, norm(cor)):.1%}")
    print("technical terms (reference count -> exact-case matches in corrected transcript):")
    for t in TERMS:
        n_ref = len(re.findall(rf"(?<![\w@]){re.escape(t)}(?![\w])", ref["full_text"], re.I))
        n_ok = len(re.findall(rf"(?<![\w@]){re.escape(t)}(?![\w])", cor))
        if n_ref:
            print(f"  {t:16} {n_ref:>2} -> {n_ok:>2}{'' if n_ok >= n_ref else '   <-- miss'}")
    # timing: a word is "in place" if it starts inside the segment being spoken (±0.5 s)
    segs = ref["segments"]
    inside = sum(1 for w in ws if any(s["start_s"] - 0.5 <= w["start_s"] <= s["end_s"] + 0.5 for s in segs))
    print(
        f"word timing: {inside}/{len(ws)} words start inside a spoken reference segment ({inside / max(len(ws), 1):.1%})"
    )
    gaps = [b["start_s"] - a["end_s"] for a, b in zip(segs, segs[1:], strict=False)]
    silent = sum(
        1
        for w in ws
        for a, b in zip(segs, segs[1:], strict=False)
        if a["end_s"] + 0.3 < w["start_s"] < b["start_s"] - 0.3
    )
    print(f"words placed in the {len(gaps)} silent gaps between segments: {silent}")
    print("\nper segment (reference | corrected ASR):")
    for s in segs:
        hyp = " ".join(
            w["corrected_text"]
            for w in ws
            if w["corrected_text"] and s["start_s"] - 0.5 <= w["start_s"] <= s["end_s"] + 0.5
        )
        print(
            f"[{s['start_s']:6.1f}-{s['end_s']:6.1f}] WER {wer(norm(s['text']), norm(hyp)):5.1%}\n  REF {s['text']}\n  ASR {hyp}"
        )


if __name__ == "__main__":
    main(*sys.argv[1:3])
