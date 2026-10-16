"""Timing consistency check for a finished render.

1. Audio offset: cross-correlate the exported clip's audio with the same span of the source recording.
   Caption times come from the source clock, so a near-zero offset means the burned-in captions and the
   speech stay together (trim + encode added no drift).
2. Words on speech: the share of caption words whose [start, end] overlaps voiced audio in the source.
   Words placed in silence would mean the transcript's word timestamps drifted.
"""

import subprocess
from pathlib import Path

import numpy as np

SR = 16_000
MAX_LAG_S = 0.5
OFFSET_OK_S = 0.04  # about one frame at 30 fps
WORDS_OK = 0.95  # measured: correct timing 1.0, words shifted 0.5 s → 0.91, 1 s → 0.72 (63 % voiced clip)
FRAME_S = 0.02


def decode(path: Path, start: float, duration: float) -> np.ndarray:
    """Mono float32 PCM at 16 kHz for [start, start + duration] of a media file."""
    out = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-ss",
            f"{start:.3f}",
            "-t",
            f"{duration:.3f}",
            "-i",
            str(path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            str(SR),
            "-f",
            "f32le",
            "-",
        ],
        capture_output=True,
        check=True,
        timeout=300,
    ).stdout
    return np.frombuffer(out, dtype=np.float32)


def audio_offset(ref: np.ndarray, test: np.ndarray, max_lag_s: float = MAX_LAG_S) -> tuple[float, float]:
    """(seconds `test` lags `ref`, normalised correlation peak 0..1) via FFT cross-correlation."""
    n = min(len(ref), len(test))
    a, b = ref[:n] - ref[:n].mean(), test[:n] - test[:n].mean()
    size = 1 << (2 * n - 1).bit_length()
    xc = np.fft.irfft(np.fft.rfft(b, size) * np.conj(np.fft.rfft(a, size)), size)
    lag = int(max_lag_s * SR)
    window = np.concatenate([xc[-lag:], xc[: lag + 1]])  # lags -lag..+lag
    i = int(np.argmax(window))
    peak = float(window[i] / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))
    return (i - lag) / SR, peak


def voiced(audio: np.ndarray) -> np.ndarray:
    """Per-20 ms frame: is someone speaking? RMS above a floor set from the quietest frames."""
    hop = int(FRAME_S * SR)
    frames = audio[: len(audio) // hop * hop].reshape(-1, hop)
    rms = np.sqrt((frames**2).mean(axis=1) + 1e-12)
    floor = np.percentile(rms, 15)
    return rms > max(floor * 3, 10 ** (-50 / 20))


def words_on_speech(audio: np.ndarray, words: list[dict], pad_s: float = 0.05) -> float:
    if not words:
        return 1.0
    v = voiced(audio)
    hit = 0
    for w in words:
        a = max(int((w["start"] - pad_s) / FRAME_S), 0)
        b = min(int((w["end"] + pad_s) / FRAME_S) + 1, len(v))
        hit += bool(v[a:b].any())
    return hit / len(words)


def check(source: Path, output: Path, doc: dict) -> dict:
    video = next(i for t in doc["tracks"] for i in t["items"] if i["type"] == "video")
    caption = next((i for t in doc["tracks"] for i in t["items"] if i["type"] == "caption"), None)
    ref = decode(source, video["sourceStart"], video["duration"])
    rendered = decode(output, video["start"], video["duration"])
    offset, peak = audio_offset(ref, rendered)
    share = words_on_speech(ref, caption["words"] if caption else [])
    return {
        "audio_offset_ms": round(offset * 1000, 1),
        "correlation": round(peak, 3),
        "words_on_speech": round(share, 3),
        "words": len(caption["words"]) if caption else 0,
        "ok": abs(offset) <= OFFSET_OK_S and peak > 0.5 and share >= WORDS_OK,
    }
