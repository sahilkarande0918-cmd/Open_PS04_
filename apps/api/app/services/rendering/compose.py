"""Compile a canonical timeline into a Hyperframes composition (index.html).

Camera: the source video sits in #cam (scaled/translated by GSAP) inside #win (the visible window).
  crop  layout → #win is the whole 9:16 frame, the crop box is scaled to full height.
  panel layout → the (wider) crop box is scaled to full width; #win shrinks to the panel's height and
                 sits above the caption zone, so long code lines stay whole and legible.
Interpolation matches the studio preview (`cropAt` in apps/web/components/studio/highlights.tsx):
linear between keyframes, a jump at `cut` keyframes or layout changes.
Captions: pages of ≤ maxLines lines (≤ maxCharsPerLine chars), the spoken word highlighted.
"""

import html
import json
import shutil
from pathlib import Path

FONTS_DIR = Path(__file__).with_name("fonts")
GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"
PANEL_CENTER = 0.4  # panel centre as a fraction of frame height (clear of the caption zone)
PAGE_GAP_S = 0.7  # a pause this long starts a new caption page
LINGER_S = 0.5  # a page stays this long after its last word when speech pauses


def camera(k: dict, w: int, h: int) -> dict:
    """Frame-space placement for one crop keyframe."""
    if k["layout"] == "panel":
        s = w / k["crop_width"]
        ph = round(k["crop_height"] * s)
        win_y = min(max(round(PANEL_CENTER * h - ph / 2), 0), h - ph)
        win = [win_y, ph]
    else:
        s = h / k["crop_height"]
        win = [0, h]
    return {
        "t": k["t"],
        "win": win,
        "cam": [round(-k["crop_x"] * s, 2), round(-k["crop_y"] * s, 2), round(s, 5)],
    }


def camera_track(keyframes: list[dict], w: int, h: int) -> list[dict]:
    out, prev = [], None
    for k in sorted(keyframes, key=lambda k: k["t"]):
        c = camera(k, w, h)
        c["jump"] = prev is None or k["transition_mode"] == "cut" or k["layout"] != prev["layout"]
        out.append(c)
        prev = k
    return out


def paginate(words: list[dict], max_chars: int, max_lines: int, duration: float) -> list[dict]:
    """[{start, end, lines: [[word, ...], ...]}] — breaks on length, long pauses and sentence ends."""
    pages, lines, line = [], [], []

    def close():
        nonlocal lines, line
        if line:
            lines.append(line)
        if lines:
            pages.append({"lines": lines})
        lines, line = [], []

    prev = None
    for w in words:
        if prev and (w["start"] - prev["end"] > PAGE_GAP_S or prev["text"][-1] in ".?!"):
            close()
        if line and len(" ".join(x["text"] for x in [*line, w])) > max_chars:
            lines.append(line)
            line = []
            if len(lines) == max_lines:
                close()
        line.append(w)
        prev = w
    close()
    for i, p in enumerate(pages):
        first, last = p["lines"][0][0], p["lines"][-1][-1]
        nxt = pages[i + 1]["lines"][0][0]["start"] if i + 1 < len(pages) else duration
        p["start"] = first["start"]
        p["end"] = min(nxt, last["end"] + LINGER_S, duration) if nxt - last["end"] > 1.0 else nxt
        p["end"] = max(p["end"], p["start"] + 0.2)
    return pages


def compile_html(doc: dict) -> str:
    w, h, dur = doc["width"], doc["height"], doc["duration"]
    video = next(i for t in doc["tracks"] for i in t["items"] if i["type"] == "video")
    caption = next((i for t in doc["tracks"] for i in t["items"] if i["type"] == "caption"), None)
    asset = doc["assets"][video["assetId"]]
    brand, style = doc["brand"], doc["captionStyle"]
    bg, text, accent = (brand["colors"][k] for k in ("background", "text", "accent"))
    fs = style["fontSize"]

    cams = camera_track(video["cropKeyframes"], w, h)
    pages = paginate(caption["words"], style["maxCharsPerLine"], style["maxLines"], dur) if caption else []
    page_html, word_times, n = [], [], 0
    for p in pages:
        flat = [x for line in p["lines"] for x in line]
        lines_html = []
        for line in p["lines"]:
            spans = []
            for x in line:
                cls = "w code" if x["isCode"] else "w"
                spans.append(f'<span id="w{n}" class="{cls}">{html.escape(x["text"])}</span>')
                idx = flat.index(x)
                off = flat[idx + 1]["start"] if idx + 1 < len(flat) else p["end"]
                word_times.append([n, x["start"], max(off, x["start"] + 0.05), x["isCode"]])
                n += 1
            lines_html.append(f'<div class="line">{"".join(spans)}</div>')
        page_html.append(
            f'<div id="cap-{len(page_html)}" class="page clip" data-start="{p["start"]:.3f}" data-duration="{p["end"] - p["start"]:.3f}">'
            f"{''.join(lines_html)}</div>"
        )

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={w}, height={h}" />
    <title>{html.escape(doc["id"])}</title>
    <script src="{GSAP_URL}"></script>
    <style>
      @font-face {{ font-family: "Archivo"; src: url("fonts/archivo-800.woff2") format("woff2"); font-weight: 800; }}
      @font-face {{ font-family: "JetBrains Mono"; src: url("fonts/jetbrains-mono-700.woff2") format("woff2"); font-weight: 700; }}
      html, body {{ margin: 0; background: {bg}; }}
      #root {{ position: relative; width: {w}px; height: {h}px; overflow: hidden; background: {bg}; }}
      #win {{ position: absolute; left: 0; top: 0; width: {w}px; height: {h}px; overflow: hidden; }}
      #cam {{ position: absolute; left: 0; top: 0; width: {asset["width"]}px; height: {asset["height"]}px; transform-origin: 0 0; }}
      #cam video {{ display: block; width: 100%; height: 100%; }}
      #caps {{ position: absolute; left: 48px; right: 48px; top: {style["safeTop"]}px; height: {style["safeBottom"] - style["safeTop"]}px; }}
      .page {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }}
      .line {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 0 10px; }}
      .w {{ font: 800 {fs}px/1.2 "Archivo", sans-serif; color: {text}; padding: 2px 12px; border-radius: 12px;
            background-color: rgba(0, 0, 0, 0); text-shadow: 0 3px 0 rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 0, 0, 0.8); }}
      .w.code {{ font: 700 {round(fs * 0.86)}px/1.2 "JetBrains Mono", monospace; color: {accent};
                 background-color: rgba(13, 15, 18, 0.82); text-shadow: none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="{w}" data-height="{h}" data-duration="{dur}">
      <div id="win"><div id="cam">
        <video id="clip" class="clip" src="{html.escape(asset["src"])}" data-start="0" data-duration="{dur}"
          data-media-start="{video["sourceStart"]}" data-has-audio="true" data-volume="{video["volume"]}"></video>
      </div></div>
      <div id="caps">{"".join(page_html)}</div>
    </div>
    <script>
      const CAMS = {json.dumps(cams)};
      const WORDS = {json.dumps(word_times)};
      const tl = gsap.timeline({{ paused: true }});
      CAMS.forEach((k, i) => {{
        const win = {{ y: k.win[0], height: k.win[1] }}, cam = {{ x: k.cam[0], y: k.cam[1], scale: k.cam[2] }};
        if (k.jump) {{ tl.set("#win", win, k.t); tl.set("#cam", cam, k.t); return; }}
        const d = Math.max(k.t - CAMS[i - 1].t, 0.001), at = CAMS[i - 1].t;
        tl.to("#win", {{ ...win, duration: d, ease: "none" }}, at);
        tl.to("#cam", {{ ...cam, duration: d, ease: "none" }}, at);
      }});
      const ON = {{ backgroundColor: "{accent}", color: "{brand_ink(accent)}", textShadow: "none" }};
      WORDS.forEach(([id, on, off, code]) => {{
        const el = "#w" + id;
        tl.set(el, ON, on);
        tl.set(el, code
          ? {{ backgroundColor: "rgba(13, 15, 18, 0.82)", color: "{accent}", textShadow: "none" }}
          : {{ backgroundColor: "rgba(0, 0, 0, 0)", color: "{text}", textShadow: "0 3px 0 rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 0, 0, 0.8)" }}, off);
      }});
      tl.set({{}}, {{}}, {dur});
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""


def brand_ink(hex_color: str) -> str:
    """Dark or light text for legibility on the accent colour (WCAG relative luminance)."""
    r, g, b = (int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5))
    lum = sum(
        c * (v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
        for c, v in zip((0.2126, 0.7152, 0.0722), (r, g, b))
    )
    return "#141005" if lum > 0.35 else "#ffffff"


def write_project(doc: dict, project_dir: Path) -> Path:
    """index.html + fonts. The caller places the source media at doc's asset `src`."""
    (project_dir / "fonts").mkdir(parents=True, exist_ok=True)
    for f in FONTS_DIR.glob("*.woff2"):
        shutil.copyfile(f, project_dir / "fonts" / f.name)
    (project_dir / "timeline.json").write_text(json.dumps(doc, indent=2), encoding="utf-8")
    index = project_dir / "index.html"
    index.write_text(compile_html(doc), encoding="utf-8")
    return index
