"""Voice energy and pause features from the 16 kHz mono WAV produced by ingestion.

Per 0.5 s window: RMS level in dBFS. From the transcript words: pauses and speech rate.
These are inputs to highlight scoring, never a score on their own (a loud moment is not a highlight).
"""

import wave
from pathlib import Path

import numpy as np

WIN_S = 0.5


def rms_db(wav: Path) -> np.ndarray:
    """RMS level per WIN_S window in dBFS (silence floor -80)."""
    with wave.open(str(wav), "rb") as w:
        if w.getsampwidth() != 2 or w.getnchannels() != 1:
            raise ValueError("expected 16-bit mono WAV")
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    n = int(sr * WIN_S)
    frames = x[: len(x) // n * n].reshape(-1, n)
    rms = np.sqrt(np.mean(frames**2, axis=1))
    return 20 * np.log10(np.maximum(rms, 1e-4))


def pauses(words: list[dict], min_gap_s: float = 0.45) -> list[tuple[float, float]]:
    """Gaps between consecutive spoken words that are at least min_gap_s long: (start, end)."""
    out = []
    for a, b in zip(words, words[1:], strict=False):
        if b["start_s"] - a["end_s"] >= min_gap_s:
            out.append((a["end_s"], b["start_s"]))
    return out


def speech_rate(words: list[dict], start: float, end: float) -> float:
    """Words per second inside [start, end)."""
    n = sum(1 for w in words if start <= w["start_s"] < end and w.get("corrected_text", w["raw_text"]))
    return n / max(end - start, 1e-6)


def energy_profile(db: np.ndarray, start: float, end: float) -> dict:
    """Level and variation inside a window, relative to the whole recording (z-scores)."""
    i, j = int(start / WIN_S), max(int(end / WIN_S), int(start / WIN_S) + 1)
    seg = db[i:j]
    voiced = db[db > -50]
    mu, sd = (float(voiced.mean()), float(voiced.std()) or 1.0) if voiced.size else (-30.0, 1.0)
    seg_v = seg[seg > -50]
    if not seg_v.size:
        return {"level_z": -3.0, "variation_z": 0.0, "voiced_ratio": 0.0}
    return {
        "level_z": round((float(seg_v.mean()) - mu) / sd, 3),
        "variation_z": round(float(seg_v.std()) / sd, 3),
        "voiced_ratio": round(seg_v.size / max(seg.size, 1), 3),
    }


if __name__ == "__main__":  # self-check on a synthetic signal: loud second half must score higher
    import tempfile

    sr = 16000
    t = np.arange(sr * 4) / sr
    sig = np.sin(2 * np.pi * 220 * t) * np.where(t < 2, 0.05, 0.4)
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "x.wav"
        with wave.open(str(p), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes((sig * 32767).astype(np.int16).tobytes())
        db = rms_db(p)
        assert energy_profile(db, 2, 4)["level_z"] > energy_profile(db, 0, 2)["level_z"]
    ws = [{"start_s": 0, "end_s": 0.4, "raw_text": "a"}, {"start_s": 1.0, "end_s": 1.3, "raw_text": "b"}]
    assert pauses(ws) == [(0.4, 1.0)] and speech_rate(ws, 0, 2) == 1.0
    print("audio_features self-check ok")
