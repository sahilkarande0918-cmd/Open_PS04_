"""Code-aware 9:16 reframing from screen activity + OCR text regions.

Output: time-based crop keyframes (Section 18 contract) — the source recording is never modified.
  {t, region, crop_x, crop_y, crop_width, crop_height, transition_mode, layout}

Layouts:
  "crop"   a full-height 9:16 window that follows the active region (code being typed, cursor, the
           window that just got focus).
  "panel"  the active region is wider than a 9:16 slice (long code lines): crop a wider box around it
           and show it as a readable panel in the portrait frame (scaled to full width, background
           filled) instead of zooming until code is cut off.
Smoothing: a dead zone, a speed cap and an ease toward the target; hard cuts (window switch, slide
change) jump instantly instead of panning across unrelated content.
"""

from dataclasses import dataclass

DEAD_ZONE = 0.18  # fraction of crop width the target may move before the camera follows
MAX_SPEED = 900.0  # px/s camera pan cap
EASE = 0.35  # fraction of the remaining distance covered per step
HOLD_S = 2.5  # keep following the last activity this long before drifting to the text region
PANEL_W = 1200  # fixed panel width: one steady zoom level for long code lines (legible at 1080 wide)
LAYOUT_HOLD = 3  # samples a new layout must persist before switching (no zoom flicker)


@dataclass
class Keyframe:
    t: float
    crop_x: int
    crop_y: int
    crop_width: int
    crop_height: int
    layout: str
    region: str
    transition_mode: str

    def as_dict(self) -> dict:
        return self.__dict__.copy()


def _union(boxes):
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[0] + b[2] for b in boxes)
    y1 = max(b[1] + b[3] for b in boxes)
    return x0, y0, x1 - x0, y1 - y0


def text_region(ocr_items: list[dict], src_w: int, src_h: int) -> tuple[int, int, int, int] | None:
    """Bounding box of the main block of text (ignores title/status bars at the screen edges)."""
    boxes = [i["box"] for i in ocr_items if src_h * 0.05 < i["box"][1] < src_h * 0.95 and i["box"][2] > 40]
    return _union(boxes) if boxes else None


def targets(samples: list[dict], ocr_frames: list[dict], start: float, end: float, src_w: int, src_h: int):
    """Per activity sample in [start, end]: (t, focus box or None, is_cut)."""
    last_box, last_t = None, -99.0
    ocr_sorted = sorted(ocr_frames, key=lambda f: f["t"])
    for s in samples:
        t = s["t"]
        if t < start - HOLD_S or t > end:
            continue
        if s["cut"]:
            last_box, last_t = None, t
        if s["box"] and s["change"] > 0.0004:
            last_box, last_t = s["box"], t
        box = last_box if t - last_t <= HOLD_S else None
        if box is None:
            prev = [f for f in ocr_sorted if f["t"] <= t] or ocr_sorted[:1]
            box = text_region(prev[-1]["items"], src_w, src_h) if prev else None
        if t >= start:
            yield t, box, s["cut"]


def plan(
    samples: list[dict],
    ocr_frames: list[dict],
    start: float,
    end: float,
    src_w: int,
    src_h: int,
    step_s: float = 0.5,
) -> list[dict]:
    crop_w = int(round(src_h * 9 / 16 / 2) * 2)  # 608 for 1080p
    panel_w = min(PANEL_W, src_w)
    panel_h = int(min(src_h, panel_w * 0.8))
    cx, cy = src_w / 2, src_h / 2
    layout, pending, streak = None, None, 0
    out: list[Keyframe] = []
    last_t = start
    for t, box, cut in targets(samples, ocr_frames, start, end, src_w, src_h):
        if t - last_t < step_s and not cut and out:
            continue
        dt = max(t - last_t, 1e-3)
        last_t = t
        if box is None:
            tx, ty, want, region = cx, cy, layout or "crop", "hold"
        else:
            bx, by, bw, bh = box
            tx, ty = bx + bw / 2, by + bh / 2
            want = "panel" if bw > crop_w * 1.15 else "crop"
            region = "active"
        # hysteresis: switch layout only after it has been wanted for LAYOUT_HOLD samples (or at a cut)
        if layout is None or cut:
            layout, pending, streak = want, None, 0
        elif want != layout:
            streak = streak + 1 if pending == want else 1
            pending = want
            if streak >= LAYOUT_HOLD:
                layout, pending, streak = want, None, 0
        else:
            pending, streak = None, 0
        w, h = (panel_w, panel_h) if layout == "panel" else (crop_w, src_h)
        if cut or not out:  # a clip opens already framed on its first target
            cx, cy, mode = tx, ty, ("cut" if cut else "start")
        elif abs(tx - cx) > DEAD_ZONE * w:
            cap = MAX_SPEED * dt
            cx += max(-cap, min(cap, (tx - cx) * EASE))
            mode = "ease"
        else:
            mode = "hold"
        if layout == "panel" and abs(ty - cy) > DEAD_ZONE * h and not cut and out:
            cy += max(-MAX_SPEED * dt, min(MAX_SPEED * dt, (ty - cy) * EASE))
        x = int(min(max(cx - w / 2, 0), src_w - w))
        y = int(min(max(cy - h / 2, 0), src_h - h)) if layout == "panel" else 0
        kf = Keyframe(round(t - start, 2), x, y, w, h, layout, region, mode)
        prev = out[-1] if out else None
        if (
            prev is None
            or cut
            or abs(prev.crop_x - kf.crop_x) > 6
            or prev.layout != kf.layout
            or abs(prev.crop_y - kf.crop_y) > 6
        ):
            out.append(kf)
    if not out:
        out.append(Keyframe(0.0, int((src_w - crop_w) / 2), 0, crop_w, src_h, "crop", "hold", "hold"))
    return [k.as_dict() for k in out]
