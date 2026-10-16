"""Compile a canonical timeline into a Hyperframes composition (index.html).

Camera: the source video sits in #cam (scaled/translated by GSAP) inside #win (the visible window).
  crop  layout → #win is the whole 9:16 frame, the crop box is scaled to full height.
  panel layout → the (wider) crop box is scaled to full width; #win shrinks to the panel's height and
                 sits above the caption zone, so long code lines stay whole and legible.
Interpolation matches the studio preview (`cropAt` in apps/web/components/studio/highlights.tsx):
linear between keyframes, a jump at `cut` keyframes or layout changes.
Captions: pages of ≤ maxLines lines (≤ maxCharsPerLine chars); presets highlight-word / karaoke / boxed.
Brand: bundled fonts only, optional intro/outro cards and a corner watermark (logo + handle). Clip-relative
times (keyframes, caption words) are offset by their item's start, i.e. the intro length.
"""

import html
import json
import shutil
from pathlib import Path

FONTS_DIR = Path(__file__).with_name("fonts")
GSAP_FILE = Path(__file__).with_name("vendor") / "gsap.min.js"  # GSAP 3.14.2, bundled so renders work offline
PANEL_CENTER = 0.4  # panel centre as a fraction of frame height, captions in the lower zone
PANEL_CENTER_UPPER_CAPTIONS = 0.6  # captions at the top: code panels sit lower


def panel_center(caption_style: dict, h: int) -> float:
    return PANEL_CENTER if caption_style["safeTop"] >= h / 2 else PANEL_CENTER_UPPER_CAPTIONS


PAGE_GAP_S = 0.7  # a pause this long starts a new caption page
LINGER_S = 0.5  # a page stays this long after its last word when speech pauses


def camera(k: dict, w: int, h: int, center: float = PANEL_CENTER) -> dict:
    """Frame-space placement for one crop keyframe."""
    if k["layout"] == "panel":
        s = w / k["crop_width"]
        ph = round(k["crop_height"] * s)
        win_y = min(max(round(center * h - ph / 2), 0), h - ph)
        win = [win_y, ph]
    else:
        s = h / k["crop_height"]
        win = [0, h]
    return {
        "t": k["t"],
        "win": win,
        "cam": [round(-k["crop_x"] * s, 2), round(-k["crop_y"] * s, 2), round(s, 5)],
    }


def camera_track(keyframes: list[dict], w: int, h: int, center: float = PANEL_CENTER) -> list[dict]:
    out, prev = [], None
    for k in sorted(keyframes, key=lambda k: k["t"]):
        c = camera(k, w, h, center)
        c["jump"] = prev is None or k["transition_mode"] == "cut" or k["layout"] != prev["layout"]
        out.append(c)
        prev = k
    return out


def _chars(ws: list[dict]) -> int:
    return len(" ".join(w["text"] for w in ws))


def _lines(ws: list[dict], max_chars: int, max_lines: int) -> list[list[dict]] | None:
    """Balanced line breaks for one page (shortest longest line), or None if it cannot fit."""
    if _chars(ws) <= max_chars or len(ws) == 1:
        return [ws]
    if max_lines < 2:
        return None
    best = None
    for i in range(1, len(ws)):
        head, rest = ws[:i], _lines(ws[i:], max_chars, max_lines - 1)
        if rest and _chars(head) <= max_chars:
            worst = max(_chars(head), *(_chars(line) for line in rest))
            if best is None or worst < best[0]:
                best = (worst, [head, *rest])
    return best[1] if best else None


def _pages(phrase: list[dict], max_chars: int, max_lines: int) -> list[list[list[dict]]]:
    """Fewest pages that fit, with the phrase split into pages of even length (no orphan words)."""
    total = _chars(phrase)
    for n in range(1, len(phrase) + 1):
        chunks, cur, pos = [], [], 0
        for w in phrase:
            mid = pos + len(w["text"]) / 2
            if cur and len(chunks) < n - 1 and mid > total * (len(chunks) + 1) / n:
                chunks.append(cur)
                cur = []
            cur.append(w)
            pos += len(w["text"]) + 1
        chunks.append(cur)
        laid = [_lines(c, max_chars, max_lines) for c in chunks]
        if all(laid):
            return laid
    return [[[w]] for w in phrase]


def paginate(words: list[dict], max_chars: int, max_lines: int, duration: float) -> list[dict]:
    """[{start, end, lines: [[word, ...], ...]}]. Phrases end at sentence ends and long pauses; each phrase
    is laid out on the fewest pages of ≤ max_lines balanced lines of ≤ max_chars characters."""
    phrases, cur = [], []
    for w in words:
        if cur and (w["start"] - cur[-1]["end"] > PAGE_GAP_S or cur[-1]["text"][-1] in ".?!"):
            phrases.append(cur)
            cur = []
        cur.append(w)
    if cur:
        phrases.append(cur)
    pages = [{"lines": lines} for ph in phrases for lines in _pages(ph, max_chars, max_lines)]
    for i, p in enumerate(pages):
        first, last = p["lines"][0][0], p["lines"][-1][-1]
        nxt = pages[i + 1]["lines"][0][0]["start"] if i + 1 < len(pages) else duration
        p["start"] = first["start"]
        p["end"] = min(nxt, last["end"] + LINGER_S, duration) if nxt - last["end"] > 1.0 else nxt
        p["end"] = max(p["end"], p["start"] + 0.2)
    return pages


FONT_FILES = {  # family → (file in fonts/, weight); all SIL OFL, bundled
    "Archivo": ("archivo-800.woff2", 800),
    "Poppins": ("poppins-700.woff2", 700),
    "Noto Sans": ("noto-sans-700.woff2", 700),
    "JetBrains Mono": ("jetbrains-mono-700.woff2", 700),
    "Fira Code": ("fira-code-600.woff2", 600),
}
SAFE_Y = 150  # keep corner marks clear of the platforms' top/bottom UI


def rgba(hex_color: str, alpha: float) -> str:
    r, g, b = (int(hex_color[i : i + 2], 16) for i in (1, 3, 5))
    return f"rgba({r}, {g}, {b}, {alpha})"


def word_states(preset: str, text: str, accent: str, ink: str, chip: str, shadow: str) -> dict:
    """GSAP property sets per caption preset: on (being spoken) and off (after) for plain/code words.
    `None` as off means the word keeps its spoken colour (karaoke fill)."""
    code_on = {"backgroundColor": accent, "color": ink}
    code_off = {"backgroundColor": chip, "color": accent}
    if preset == "karaoke":
        return {"on": {"color": accent}, "off": None, "code_on": code_on, "code_off": code_off}
    if preset == "boxed":
        return {"on": {"color": accent}, "off": {"color": text}, "code_on": code_on, "code_off": code_off}
    return {  # highlight-word: the spoken word sits on an accent pill
        "on": {"backgroundColor": accent, "color": ink, "textShadow": "none"},
        "off": {"backgroundColor": "rgba(0, 0, 0, 0)", "color": text, "textShadow": shadow},
        "code_on": code_on,
        "code_off": code_off,
    }


def compile_html(doc: dict) -> str:
    w, h, dur = doc["width"], doc["height"], doc["duration"]
    video = next(i for t in doc["tracks"] for i in t["items"] if i["type"] == "video")
    caption = next((i for t in doc["tracks"] for i in t["items"] if i["type"] == "caption"), None)
    asset = doc["assets"][video["assetId"]]
    brand, style = doc["brand"], doc["captionStyle"]
    bg, text, accent = (brand["colors"][k] for k in ("background", "text", "accent"))
    ink = brand_ink(accent)
    body_font, code_font = brand["fonts"]["body"], brand["fonts"]["code"]
    fs = style["fontSize"]
    preset = style.get("preset", "highlight-word")
    lead, clip_d = video["start"], video["duration"]
    tail_at = lead + clip_d
    intro = brand.get("intro") or {"enabled": False}
    outro = brand.get("outro") or {"enabled": False}
    watermark = brand.get("watermark") or {"enabled": False}
    logo_id = brand.get("logoAssetId")
    logo_src = html.escape(doc["assets"][logo_id]["src"]) if logo_id else None
    handle = html.escape(brand.get("handle") or "")
    shadow = "0 3px 0 rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 0, 0, 0.8)"
    chip = rgba(bg, 0.85)
    states = word_states(preset, text, accent, ink, chip, shadow)

    cams = camera_track(video["cropKeyframes"], w, h, panel_center(style, h))
    for c in cams:
        c["t"] = round(c["t"] + lead, 3)
    cap_at = caption["start"] if caption else 0
    pages = paginate(caption["words"], style["maxCharsPerLine"], style["maxLines"], clip_d) if caption else []
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
                on_t = round(cap_at + x["start"], 3)
                word_times.append([n, on_t, round(cap_at + max(off, x["start"] + 0.05), 3), x["isCode"]])
                n += 1
            lines_html.append(f'<div class="line">{"".join(spans)}</div>')
        page_html.append(
            f'<div id="cap-{len(page_html)}" class="page clip" data-start="{cap_at + p["start"]:.3f}" '
            f'data-duration="{p["end"] - p["start"]:.3f}">{"".join(lines_html)}</div>'
        )

    fonts_css = "\n".join(
        f'      @font-face {{ font-family: "{f}"; src: url("fonts/{FONT_FILES[f][0]}") format("woff2"); '
        f"font-weight: {FONT_FILES[f][1]}; }}"
        for f in dict.fromkeys([body_font, code_font])
    )
    bw, cw = FONT_FILES[body_font][1], FONT_FILES[code_font][1]
    logo_img = f'<img class="logo" src="{logo_src}" alt="" />' if logo_src else ""

    cards = []
    if intro.get("enabled") and lead > 0:
        cards.append(
            f'<div id="intro" class="card clip" data-start="0" data-duration="{lead}">{logo_img}'
            f'<div class="bar"></div><h1 id="intro-title">{html.escape(intro.get("title", ""))}</h1></div>'
        )
    if outro.get("enabled") and dur - tail_at > 0:
        cards.append(
            f'<div id="outro" class="card clip" data-start="{tail_at}" data-duration="{round(dur - tail_at, 3)}">'
            f'{logo_img}<h1 id="outro-cta">{html.escape(outro.get("cta", ""))}</h1>'
            + (f'<p class="handle">{handle}</p>' if handle else "")
            + "</div>"
        )
    mark = ""
    if watermark.get("enabled") and (logo_src or handle):
        vert, horiz = watermark.get("position", "top-right").split("-")
        pos = f"{vert}: {SAFE_Y}px; {horiz}: 44px;"
        mark = (
            f'<div id="mark" class="clip" data-start="{lead}" data-duration="{clip_d}" style="{pos}">'
            + (f'<img src="{logo_src}" alt="" />' if logo_src else "")
            + (f"<span>{handle}</span>" if handle else "")
            + "</div>"
        )

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={w}, height={h}" />
    <title>{html.escape(doc["id"])}</title>
    <script src="gsap.min.js"></script>
    <style>
{fonts_css}
      html, body {{ margin: 0; background: {bg}; }}
      #root {{ position: relative; width: {w}px; height: {h}px; overflow: hidden; background: {bg}; }}
      #win {{ position: absolute; left: 0; top: 0; width: {w}px; height: {h}px; overflow: hidden; }}
      #cam {{ position: absolute; left: 0; top: 0; width: {asset["width"]}px; height: {asset["height"]}px; transform-origin: 0 0; }}
      #cam video {{ display: block; width: 100%; height: 100%; }}
      #caps {{ position: absolute; left: 48px; right: 48px; top: {style["safeTop"]}px; height: {style["safeBottom"] - style["safeTop"]}px; }}
      .page {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }}
      .line {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 0 10px; }}
      .w {{ font: {bw} {fs}px/1.2 "{body_font}", sans-serif; color: {text}; padding: 2px 12px; border-radius: 12px;
            background-color: rgba(0, 0, 0, 0); text-shadow: {shadow}; }}
      .w.code {{ font: {cw} {round(fs * 0.86)}px/1.2 "{code_font}", monospace; color: {accent};
                 background-color: {chip}; text-shadow: none; }}
      .boxed .page {{ inset: auto 0; top: 50%; transform: translateY(-50%); padding: 22px 18px; border-radius: 24px;
                      background: {rgba(bg, 0.82)}; }}
      .boxed .w {{ text-shadow: none; }}
      .card {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
               gap: 36px; padding: 0 90px; background: {bg}; text-align: center; }}
      .card .logo {{ max-width: 520px; max-height: 300px; object-fit: contain; }}
      .card h1 {{ margin: 0; font: {bw} 84px/1.12 "{body_font}", sans-serif; color: {text}; letter-spacing: -0.01em; }}
      .card .bar {{ width: 140px; height: 10px; border-radius: 5px; background: {accent}; }}
      .card .handle {{ margin: 0; font: {bw} 52px/1.2 "{body_font}", sans-serif; color: {accent}; }}
      #mark {{ position: absolute; display: flex; align-items: center; gap: 14px; padding: 10px 18px; border-radius: 18px;
                background: {rgba(bg, 0.72)}; }}
      #mark img {{ height: 84px; max-width: 260px; object-fit: contain; }}
      #mark span {{ font: {bw} 34px/1 "{body_font}", sans-serif; color: {text}; text-shadow: {shadow}; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="{w}" data-height="{h}" data-duration="{dur}">
      <div id="win"><div id="cam">
        <video id="clip" class="clip" src="{html.escape(asset["src"])}" data-start="{lead}" data-duration="{clip_d}"
          data-media-start="{video["sourceStart"]}" data-has-audio="true" data-volume="{video["volume"]}"></video>
      </div></div>
      <div id="caps"{' class="boxed"' if preset == "boxed" else ""}>{"".join(page_html)}</div>
      {mark}
      {"".join(cards)}
    </div>
    <script>
      const CAMS = {json.dumps(cams)};
      const WORDS = {json.dumps(word_times)};
      const S = {json.dumps(states)};
      const tl = gsap.timeline({{ paused: true }});
      CAMS.forEach((k, i) => {{
        const win = {{ y: k.win[0], height: k.win[1] }}, cam = {{ x: k.cam[0], y: k.cam[1], scale: k.cam[2] }};
        if (k.jump) {{ tl.set("#win", win, k.t); tl.set("#cam", cam, k.t); return; }}
        const d = Math.max(k.t - CAMS[i - 1].t, 0.001), at = CAMS[i - 1].t;
        tl.to("#win", {{ ...win, duration: d, ease: "none" }}, at);
        tl.to("#cam", {{ ...cam, duration: d, ease: "none" }}, at);
      }});
      WORDS.forEach(([id, on, off, code]) => {{
        const el = "#w" + id;
        tl.set(el, code ? S.code_on : S.on, on);
        const after = code ? S.code_off : S.off;
        if (after) tl.set(el, after, off);
      }});
      if (document.querySelector("#intro")) {{
        tl.fromTo("#intro .logo", {{ opacity: 0, scale: 0.9 }}, {{ opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }}, 0.05);
        tl.fromTo("#intro .bar", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.45, ease: "power2.out" }}, 0.2);
        tl.fromTo("#intro-title", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }}, 0.3);
      }}
      if (document.querySelector("#outro")) {{
        tl.fromTo("#outro-cta", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }}, {tail_at + 0.1});
        tl.fromTo("#outro .handle", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {tail_at + 0.4});
      }}
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
    """index.html + the fonts it uses. The caller places the source media (and logo) at their asset `src`."""
    (project_dir / "fonts").mkdir(parents=True, exist_ok=True)
    for family in dict.fromkeys(doc["brand"]["fonts"].values()):
        name = FONT_FILES[family][0]
        shutil.copyfile(FONTS_DIR / name, project_dir / "fonts" / name)
    shutil.copyfile(GSAP_FILE, project_dir / GSAP_FILE.name)
    (project_dir / "timeline.json").write_text(json.dumps(doc, indent=2), encoding="utf-8")
    index = project_dir / "index.html"
    index.write_text(compile_html(doc), encoding="utf-8")
    return index
