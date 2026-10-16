"""Screen activity from a screen-share recording, sampled cheaply.

Frames are decoded by FFmpeg at SAMPLE_FPS, downscaled and converted to grayscale, so a 1-hour
class costs ~7 200 small frames instead of 108 000 full ones. For each sample we keep:
  - change: fraction of pixels that changed vs the previous sample (typing, scrolling, slides)
  - box:    bounding box of the changed area, in source pixels (where the action is)
  - text:   edge density, a cheap "text-heavy frame" signal (code and slides are dense)
  - cut:    a large global change (window switch, slide change)
"""

import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path

import cv2
import numpy as np

SAMPLE_FPS = 2.0
WORK_W = 480
CUT_FRACTION = 0.35  # >35 % of pixels changed between samples = scene switch
DIFF_THRESHOLD = 18  # grey levels


@dataclass
class Sample:
    t: float
    change: float
    box: tuple[int, int, int, int] | None  # x, y, w, h in source pixels
    text: float
    cut: bool


def _frames(video: Path, src_w: int, src_h: int):
    h = int(round(WORK_W * src_h / src_w / 2) * 2)
    proc = subprocess.Popen(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(video),
            "-vf",
            f"fps={SAMPLE_FPS},scale={WORK_W}:{h}:flags=area,format=gray",
            "-f",
            "rawvideo",
            "-",
        ],
        stdout=subprocess.PIPE,
    )
    size = WORK_W * h
    assert proc.stdout
    i = 0
    while chunk := proc.stdout.read(size):
        if len(chunk) < size:
            break
        yield i / SAMPLE_FPS, np.frombuffer(chunk, np.uint8).reshape(h, WORK_W)
        i += 1
    proc.wait()


def analyze(video: Path, src_w: int, src_h: int) -> list[Sample]:
    scale = src_w / WORK_W
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 5))
    out: list[Sample] = []
    prev = None
    for t, frame in _frames(video, src_w, src_h):
        edges = cv2.Canny(frame, 60, 160)
        text = float(np.count_nonzero(edges)) / edges.size
        if prev is None:
            out.append(Sample(t, 0.0, None, round(text, 4), False))
            prev = frame
            continue
        diff = cv2.absdiff(frame, prev) > DIFF_THRESHOLD
        change = float(diff.mean())
        box = None
        if 0 < change < CUT_FRACTION:
            mask = cv2.dilate(diff.astype(np.uint8) * 255, kernel)
            n, _, stats, _ = cv2.connectedComponentsWithStats(mask)
            # ignore specks (cursor blink noise) but keep a moving cursor or typed line
            comps = [s for s in stats[1:n] if s[cv2.CC_STAT_AREA] >= 12]
            if comps:
                x0 = min(s[0] for s in comps)
                y0 = min(s[1] for s in comps)
                x1 = max(s[0] + s[2] for s in comps)
                y1 = max(s[1] + s[3] for s in comps)
                box = (int(x0 * scale), int(y0 * scale), int((x1 - x0) * scale), int((y1 - y0) * scale))
        out.append(Sample(t, round(change, 4), box, round(text, 4), change >= CUT_FRACTION))
        prev = frame
    return out


def to_json(samples: list[Sample]) -> list[dict]:
    return [asdict(s) for s in samples]
