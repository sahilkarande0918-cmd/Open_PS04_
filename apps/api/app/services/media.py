"""FFprobe/FFmpeg helpers. Always argument lists, never shell strings (no injection surface)."""

import json
import subprocess
from pathlib import Path

ALLOWED_EXT = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}
MAX_BYTES = 4 * 1024**3
MAX_DURATION_S = 4 * 3600
MIN_DURATION_S = 5


class MediaError(ValueError):
    pass


def probe(path: Path) -> dict:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if r.returncode != 0:
        raise MediaError("Not a readable media file")
    return json.loads(r.stdout)


def summarize(info: dict) -> dict:
    """Validate a probe result and return the fields we store. Raises MediaError with a user-facing reason."""
    streams = info.get("streams", [])
    video = next(
        (
            s
            for s in streams
            if s.get("codec_type") == "video" and s.get("disposition", {}).get("attached_pic") != 1
        ),
        None,
    )
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if not video:
        raise MediaError("The file has no video stream")
    if not audio:
        raise MediaError("The file has no audio track, so there is nothing to transcribe")
    duration = float(info.get("format", {}).get("duration") or video.get("duration") or 0)
    if duration < MIN_DURATION_S:
        raise MediaError(f"Recording is shorter than {MIN_DURATION_S} seconds")
    if duration > MAX_DURATION_S:
        raise MediaError("Recording is longer than 4 hours")
    num, _, den = (video.get("avg_frame_rate") or "0/1").partition("/")
    fps = float(num) / float(den) if float(den or 0) else None
    return {
        "duration_s": round(duration, 3),
        "width": video.get("width"),
        "height": video.get("height"),
        "fps": round(fps, 3) if fps else None,
        "video_codec": video.get("codec_name"),
        "audio_codec": audio.get("codec_name"),
    }


def extract_audio(src: Path, dst: Path) -> None:
    """16 kHz mono WAV, loudness-normalised for ASR (EBU R128 single pass)."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".tmp.wav")
    r = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(src),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-af",
            "highpass=f=60,loudnorm=I=-18:TP=-2:LRA=11",
            "-c:a",
            "pcm_s16le",
            str(tmp),
        ],
        capture_output=True,
        text=True,
        timeout=3600,
    )
    if r.returncode != 0:
        tmp.unlink(missing_ok=True)
        raise MediaError(f"Audio extraction failed: {r.stderr.strip()[-300:]}")
    tmp.replace(dst)
