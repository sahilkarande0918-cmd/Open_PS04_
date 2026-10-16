"""Local OCR of sampled frames (RapidOCR, ONNX on CPU) and extraction of code identifiers."""

import re
import subprocess
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np

IDENT = re.compile(r"@?[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*")


@lru_cache
def _engine():
    from rapidocr_onnxruntime import RapidOCR

    return RapidOCR()


def frame_at(video: Path, t: float) -> np.ndarray | None:
    r = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-ss",
            f"{t:.3f}",
            "-i",
            str(video),
            "-frames:v",
            "1",
            "-f",
            "image2pipe",
            "-vcodec",
            "png",
            "-",
        ],
        capture_output=True,
        timeout=60,
    )
    if r.returncode != 0 or not r.stdout:
        return None
    return cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR)


def ocr_frame(img: np.ndarray, min_conf: float = 0.8) -> list[dict]:
    result, _ = _engine()(img)
    out = []
    for box, text, conf in result or []:
        if conf >= min_conf:
            xs, ys = [p[0] for p in box], [p[1] for p in box]
            out.append(
                {
                    "text": text,
                    "conf": round(float(conf), 3),
                    "box": [int(min(xs)), int(min(ys)), int(max(xs) - min(xs)), int(max(ys) - min(ys))],
                }
            )
    return out


def ocr_video(video: Path, times: list[float]) -> list[dict]:
    frames = []
    for t in times:
        img = frame_at(video, t)
        if img is not None:
            frames.append({"t": round(t, 2), "items": ocr_frame(img)})
    return frames


def code_identifiers(text: str) -> set[str]:
    """Identifiers distinctive enough to be evidence: camelCase/PascalCase, @annotations, dotted names."""
    out = set()
    for m in IDENT.findall(text):
        name = m.rstrip(".")
        if len(name) < 6:
            continue
        if name.startswith("@") or re.search(r"[a-z][A-Z]", name) or re.search(r"^[A-Z][a-z]+[A-Z]", name):
            out.add(name)
    return out


def screen_tokens(frames: list[dict]) -> list[tuple[float, str]]:
    """(time, identifier) pairs for every identifier seen on screen."""
    return [(f["t"], tok) for f in frames for it in f["items"] for tok in code_identifiers(it["text"])]
