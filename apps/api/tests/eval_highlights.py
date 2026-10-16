"""How well do stored highlight boundaries match a fixture's real topic boundaries? (manual tool)

    python tests/eval_highlights.py RECORDING_ID path/to/<name>.reference.json

A boundary "hits" if it is within TOL seconds of a reference segment start (for clip starts) or
segment end (for clip ends). Reference segments are the instructor's complete thoughts.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from app.core.db import service_client  # noqa: E402

TOL = 1.0


def main(rec_id: str, ref_path: str) -> None:
    ref = json.loads(Path(ref_path).read_text(encoding="utf-8"))
    starts = [s["start_s"] for s in ref["segments"]]
    ends = [s["end_s"] for s in ref["segments"]]
    rows = (
        service_client()
        .table("highlight_candidates")
        .select("rank,start_s,end_s,score,title,crop_keyframes")
        .eq("recording_id", rec_id)
        .order("rank")
        .execute()
        .data
    )
    hs = he = 0
    for r in rows:
        ds = min(abs(r["start_s"] - s) for s in starts)
        de = min(abs(r["end_s"] - e) for e in ends)
        hs += ds <= TOL
        he += de <= TOL
        layouts = sorted({k["layout"] for k in r["crop_keyframes"]})
        print(
            f"#{r['rank']} {r['start_s']:6.1f}-{r['end_s']:6.1f} ({r['end_s'] - r['start_s']:4.1f}s) score {r['score']:.3f} "
            f"start {'HIT' if ds <= TOL else f'off {ds:.1f}s'} end {'HIT' if de <= TOL else f'off {de:.1f}s'} "
            f"| {len(r['crop_keyframes'])} keyframes {layouts} | {r['title']}"
        )
    n = max(len(rows), 1)
    print(
        f"starts on a topic boundary: {hs}/{len(rows)} ({hs / n:.0%})   ends on a topic boundary: {he}/{len(rows)} ({he / n:.0%})"
    )
    print(f"all clips 30-60 s: {all(30 <= r['end_s'] - r['start_s'] <= 60 for r in rows)}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
