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
PANEL_MAX_W = 1280  # widest source box shown as a portrait panel (keeps code legible at 1080 wide)


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
    cx = src_w / 2
    out: list[Keyframe] = []
    last_t = start
    for t, box, cut in targets(samples, ocr_frames, start, end, src_w, src_h):
        if t - last_t < step_s and not cut and out:
            continue
        dt = max(t - last_t, 1e-3)
        last_t = t
        if box is None:
            tx, layout, w, h, y = cx, "crop", crop_w, src_h, 0
            region = "hold"
        else:
            bx, by, bw, bh = box
            tx = bx + bw / 2
            if bw > crop_w * 1.15:
                layout = "panel"
                w = int(min(max(bw * 1.08, crop_w), PANEL_MAX_W, src_w))
                h = int(min(src_h, max(bh * 1.4, w * 0.75)))  # show surrounding lines for context
                y = int(min(max(by + bh / 2 - h / 2, 0), src_h - h))
            else:
                layout, w, h, y = "crop", crop_w, src_h, 0
            region = "active"
        if cut or not out:  # a clip opens already framed on its first target
            cx, mode = tx, ("cut" if cut else "start")
        elif abs(tx - cx) > DEAD_ZONE * crop_w:
            move = (tx - cx) * EASE
            cap = MAX_SPEED * dt
            cx += max(-cap, min(cap, move))
            mode = "ease"
        else:
            mode = "hold"
        x = int(min(max(cx - w / 2, 0), src_w - w))
        kf = Keyframe(round(t - start, 2), x, y, w, h, layout, region, mode)
        prev = out[-1] if out else None
        if (
            prev is None
            or cut
            or abs(prev.crop_x - kf.crop_x) > 6
            or prev.layout != kf.layout
            or abs(prev.crop_y - kf.crop_y) > 6
            or abs(prev.crop_width - kf.crop_width) > 12
        ):
            out.append(kf)
    if not out:
        out.append(Keyframe(0.0, int((src_w - crop_w) / 2), 0, crop_w, src_h, "crop", "hold", "hold"))
    return [k.as_dict() for k in out]
