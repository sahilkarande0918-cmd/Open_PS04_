"""render job: canonical timeline → Hyperframes project → `hyperframes render` → ffprobe-verified MP4
+ thumbnail. Progress comes from the CLI's structured `@hf-progress` lines."""

import json
import logging
import os
import shutil
import subprocess
import time
from pathlib import Path

from app.core.config import get_settings
from app.core.db import service_client
from app.core.storage import render_dir, source_path
from app.services import media
from app.services.rendering import compose, sync, timeline
from app.workers.jobs import Cancelled, JobContext, Permanent

log = logging.getLogger(__name__)
HYPERFRAMES = "hyperframes@0.8.164"
ENV = {**os.environ, "HYPERFRAMES_TELEMETRY": "0", "DO_NOT_TRACK": "1"}
RENDER_SPAN = (0.06, 0.94)  # share of job progress covered by the CLI


def _npx() -> str:
    found = shutil.which("npx")
    if not found:
        raise Permanent("Node.js (npx) is not installed on the processing machine")
    return found


def _update(render_id: str, **fields) -> None:
    service_client().table("render_jobs").update(fields).eq("id", render_id).execute()


def _link_source(src: Path, dst: Path) -> None:
    if dst.exists():
        return
    try:
        os.link(src, dst)  # same volume: no copy of a multi-GB recording
    except OSError:
        shutil.copyfile(src, dst)


def _render(ctx: JobContext, project: Path, quality: str) -> None:
    cmd = [_npx(), "--yes", HYPERFRAMES, "render", "--quality", quality, "--video-frame-format", "png"]
    cmd += ["--output", "out.mp4", "."]
    log_path = project / "render.log"
    with log_path.open("w", encoding="utf-8") as logf:
        proc = subprocess.Popen(
            cmd,
            cwd=project,
            env=ENV,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
        )
        assert proc.stdout
        last = 0.0
        try:
            for line in proc.stdout:
                logf.write(line)
                if line.startswith("@hf-progress ") and time.monotonic() - last > 2:
                    pct = json.loads(line[len("@hf-progress ") :]).get("pct", 0)
                    ctx.progress(RENDER_SPAN[0] + (RENDER_SPAN[1] - RENDER_SPAN[0]) * pct / 100)
                    ctx.check_cancel()
                    last = time.monotonic()
        except Cancelled:
            proc.kill()
            raise
        if proc.wait() != 0:
            tail = log_path.read_text(encoding="utf-8")[-1500:]
            raise RuntimeError(f"hyperframes render exited {proc.returncode}: {tail}")


def verify(path: Path, expected_s: float, width: int, height: int) -> dict:
    """The output must be what the timeline asked for: size, duration (±0.1 s), H.264 + audio."""
    info = media.probe(path)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    has_audio = any(s["codec_type"] == "audio" for s in info["streams"])
    dur = float(info["format"]["duration"])
    num, den = (int(x) for x in v["r_frame_rate"].split("/"))
    problems = []
    if (v["width"], v["height"]) != (width, height):
        problems.append(f"size {v['width']}x{v['height']}")
    if abs(dur - expected_s) > 0.1:
        problems.append(f"duration {dur:.3f}s vs {expected_s:.3f}s")
    if v["codec_name"] != "h264" or not has_audio:
        problems.append(f"codec {v['codec_name']}, audio={has_audio}")
    if problems:
        raise Permanent("Rendered file failed verification: " + "; ".join(problems))
    return {"duration_s": dur, "width": v["width"], "height": v["height"], "fps": num / den}


def run_render(ctx: JobContext) -> dict:
    db = service_client()
    rid = ctx.payload["render_id"]
    render = (db.table("render_jobs").select("*").eq("id", rid).limit(1).execute().data or [None])[0]
    if not render:
        raise Permanent("render row not found")
    rec = (
        db.table("source_recordings").select("*").eq("id", render["recording_id"]).limit(1).execute().data
        or [None]
    )[0]
    if not rec or not source_path(rec).exists():
        raise Permanent("source recording is missing on this machine")
    doc = render["timeline"]
    try:
        timeline.validate(doc)
        _update(rid, status="rendering", error=None)
        started = time.monotonic()
        ctx.stage("compose", 0.02, "Compiling the timeline into a Hyperframes composition")
        project = render_dir(render["organization_id"], rid)
        compose.write_project(doc, project)
        _link_source(source_path(rec), project / doc["assets"]["source"]["src"])

        ctx.stage("lint", 0.04, "Checking the composition")
        lint = subprocess.run(
            [_npx(), "--yes", HYPERFRAMES, "lint", "--json", "."],
            cwd=project,
            env=ENV,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=300,
        )
        try:
            errors = json.loads(lint.stdout).get("errorCount", 0)
        except json.JSONDecodeError:
            errors = 0 if lint.returncode == 0 else 1
        if errors:
            raise Permanent(f"composition lint failed: {lint.stdout[-1500:]}")

        ctx.stage("render", RENDER_SPAN[0], "Rendering frames")
        _render(ctx, project, render["quality"])

        ctx.stage("verify", 0.95, "Verifying the MP4")
        out = project / "out.mp4"
        meta = verify(out, doc["duration"], doc["width"], doc["height"])
        thumb = project / "thumb.jpg"
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-y",
                "-ss",
                f"{min(doc['duration'] / 3, 10):.2f}",
                "-i",
                str(out),
                "-frames:v",
                "1",
                "-vf",
                "scale=540:-2",
                str(thumb),
            ],
            check=True,
            timeout=120,
        )
        (project / doc["assets"]["source"]["src"]).unlink(
            missing_ok=True
        )  # the link is only needed to render
        data_dir = get_settings().data_dir
        fields = {
            **meta,
            "status": "ready",
            "output_path": out.relative_to(data_dir).as_posix(),
            "thumbnail_path": thumb.relative_to(data_dir).as_posix(),
            "size_bytes": out.stat().st_size,
            "render_s": round(time.monotonic() - started, 1),
        }
        _update(rid, **fields)
        ctx.stage("sync_check", 0.98, "Checking caption and audio timing")
        try:
            timing = sync.check(source_path(rec), out, doc)
        except Exception as e:  # noqa: BLE001 — a failed check is reported, never discards a good render
            log.warning("timing check failed: %s", e)
            timing = {"ok": None, "error": f"{type(e).__name__}: {e}"[:300]}
        return {"render_id": rid, **fields, "timing": timing}
    except Cancelled:
        _update(rid, status="cancelled")
        raise
    except Exception as e:
        _update(rid, status="failed", error=f"{type(e).__name__}: {e}"[:2000])
        raise
