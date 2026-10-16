"""Build the SYNTHETIC Hinglish lecture fixtures (narration + screen recording) with local tools only.

    python tests/fixtures/lecture/build.py [--out DIR] [--only lecture|focus]

Outputs (outside git, in DATA_DIR/test-recordings by default):
  <name>.mp4            1920x1080 30 fps screen recording with narration (Hyperframes render)
  <name>.reference.json intended narration, per-segment timing, screen events  (TEST REFERENCE ONLY:
                        never fed to transcription — ASR output is compared against it afterwards)
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from xml.sax.saxutils import escape

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import script  # noqa: E402

TTS = HERE.parent / "tts-onecore.ps1"
LEAD_IN, GAP, TAIL = 1.2, 0.7, 1.5


def ssml(say: str) -> str:
    parts = []
    for chunk in say.split("|"):
        chunk = escape(chunk.strip())
        chunk = re.sub(
            r"\*(.+?)\*",
            r'<prosody rate="-15%" pitch="+10%" volume="+20%">\1</prosody>',
            chunk,
        )
        parts.append(chunk)
    body = ' <break time="420ms"/> '.join(parts)
    return f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">{body}</speak>'


def plain(say: str) -> str:
    return re.sub(r"\s+", " ", say.replace("|", " ").replace("*", "")).strip()


def duration(p: Path) -> float:
    r = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            str(p),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(r.stdout)


def synth(segments: list[dict], work: Path) -> tuple[Path, list[dict]]:
    timed, t, inputs = [], LEAD_IN, []
    for i, seg in enumerate(segments):
        s, w = work / f"seg{i:02}.ssml", work / f"seg{i:02}.wav"
        s.write_text(ssml(seg["say"]), encoding="utf-8")
        subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(TTS),
                "-Ssml",
                str(s),
                "-Out",
                str(w),
                "-Voice",
                "Ravi",
            ],
            check=True,
            capture_output=True,
        )
        d = duration(w)
        timed.append(
            {
                "idx": i,
                "start_s": round(t, 3),
                "end_s": round(t + d, 3),
                "text": plain(seg["say"]),
            }
        )
        inputs.append((w, t))
        t += d + GAP
    total = round(t - GAP + TAIL, 2)
    # place each segment at its start time on a silent bed (exact, no drift)
    args = [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-f",
        "lavfi",
        "-t",
        str(total),
        "-i",
        "anullsrc=r=48000:cl=mono",
    ]
    for w, _ in inputs:
        args += ["-i", str(w)]
    delays = "".join(
        f"[{k + 1}]aresample=48000,adelay={int(st * 1000)}[a{k}];"
        for k, (_, st) in enumerate(inputs)
    )
    mix = "[0]" + "".join(f"[a{k}]" for k in range(len(inputs)))
    out = work / "narration.wav"
    args += [
        "-filter_complex",
        f"{delays}{mix}amix=inputs={len(inputs) + 1}:normalize=0[m]",
        "-map",
        "[m]",
        "-c:a",
        "pcm_s16le",
        str(out),
    ]
    subprocess.run(args, check=True)
    return out, timed, total


def weight(a: tuple, files: dict) -> float:
    op = a[0]
    if op == "type":
        return 4 + len(a[3]) * 0.9
    if op == "edit":
        old = files[a[1]][a[2]]
        k = 0
        while k < min(len(old), len(a[3])) and old[k] == a[3][k]:
            k += 1
        return 4 + (len(old) - k) * 0.4 + (len(a[3]) - k) * 0.9
    if op == "term":
        return 4 + len(a[1]) * 0.8
    return {"show": 3, "panel": 8, "point": 10, "select": 6, "scroll": 14, "wait": 25}[
        op
    ]


def events(segments: list[dict], timed: list[dict], files0: dict) -> list[dict]:
    files = {k: list(v) for k, v in files0.items()}
    out, term_i = [], 0
    for seg, tm in zip(segments, timed, strict=True):
        acts = seg["do"]
        span = (tm["end_s"] - tm["start_s"]) * 0.92
        sim, ws = {k: list(v) for k, v in files.items()}, []
        for a in acts:  # weights must see earlier inserts of the same segment
            ws.append(weight(a, sim))
            if a[0] == "type":
                sim[a[1]].insert(a[2], a[3])
            elif a[0] == "edit":
                sim[a[1]][a[2]] = a[3]
        t = tm["start_s"]
        for a, w in zip(acts, ws, strict=True):
            d = span * w / sum(ws)
            op = a[0]
            e = {"op": op, "t0": round(t, 3), "t1": round(t + d * 0.9, 3)}
            if op == "show":
                e["file"] = a[1]
            elif op == "type":
                e.update(file=a[1], line=a[2], text=a[3])
                files[a[1]].insert(a[2], a[3])
            elif op == "edit":
                e.update(file=a[1], line=a[2], text=a[3])
                files[a[1]][a[2]] = a[3]
            elif op == "scroll":
                e.update(file=a[1], to=a[2])
            elif op == "select":
                e.update(file=a[1], a=a[2], b=a[3])
            elif op == "point":
                e.update(file=a[1], line=a[2])
            elif op == "panel":
                e["panel"] = a[1]
            elif op == "term":
                e.update(text=a[1], index=term_i)
                term_i += 1
            if op != "wait":
                out.append(e)
            t += d
    return out


def build(
    name: str, segments: list[dict], files: dict, browser: dict, out_dir: Path
) -> None:
    work = out_dir / f"{name}.build"
    shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True)
    narration, timed, total = synth(segments, work)
    evs = events(segments, timed, files)
    html = (HERE / "screen.html").read_text(encoding="utf-8")
    html = (
        html.replace("__DURATION__", str(total))
        .replace("__FILES__", json.dumps(files))
        .replace("__EVENTS__", json.dumps(evs))
        .replace("__BROWSER__", json.dumps(browser))
    )
    proj = work / "project"
    proj.mkdir()
    (proj / "index.html").write_text(html, encoding="utf-8")
    shutil.copy(narration, proj / "narration.wav")
    mp4 = out_dir / f"{name}.mp4"
    subprocess.run(
        [
            "npx",
            "--yes",
            "hyperframes@0.8.164",
            "render",
            "--quality",
            "looks",
            "--output",
            str(mp4),
        ],
        cwd=proj,
        check=True,
        shell=sys.platform == "win32",
    )
    ref = {
        "synthetic": True,
        "voice": "Microsoft Ravi (en-IN, Windows OneCore) reading Roman-script Hinglish",
        "duration_s": total,
        "segments": timed,
        "full_text": " ".join(s["text"] for s in timed),
        "screen_events": evs,
        "note": "Reference for evaluation only. Word timings inside a segment are not known exactly.",
    }
    (out_dir / f"{name}.reference.json").write_text(
        json.dumps(ref, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"{mp4}  {total}s  {len(timed)} segments  {len(evs)} screen events")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--out", default="C:/Users/Sahil/AppData/Local/reel-studio/data/test-recordings"
    )
    ap.add_argument("--only", choices=["lecture", "focus"])
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    if args.only in (None, "lecture"):
        users = "".join(
            f"<li>{n}</li>"
            for n in ["Asha Verma", "Rohan Gupta", "Meera Iyer", "Kabir Shah"]
        )
        build(
            "react-hooks-hinglish",
            script.SEGMENTS,
            script.FILES,
            {"url": "localhost:5173", "html": f"<h2>Users</h2><ul>{users}</ul>"},
            out,
        )
    if args.only in (None, "focus"):
        build(
            "express-scroll-focus",
            script.FOCUS_SEGMENTS,
            script.FOCUS_FILES,
            {
                "url": "localhost:3000/api/users",
                "html": '<pre style="font-size:22px">[{"id":1,"name":"Asha"},{"id":2,"name":"Rohan"},'
                '{"id":3,"name":"Meera"}]</pre>',
            },
            out,
        )


if __name__ == "__main__":
    main()
