"""Canonical timeline from a highlight: one source video item following the crop keyframes, plus
word-level captions from the corrected transcript. Validated against the schema generated from
`packages/timeline-schema` (Zod is the source of truth)."""

import hashlib
import json
import re
from functools import cache
from pathlib import Path

import jsonschema

SCHEMA_PATH = Path(__file__).parents[5] / "packages" / "timeline-schema" / "timeline.schema.json"
W, H = 1080, 1920

DEFAULT_BRAND = {
    "name": "",
    "handle": "",
    "colors": {"background": "#0d0f12", "text": "#ffffff", "accent": "#f5a524"},
    "fonts": {"body": "Archivo", "code": "JetBrains Mono"},
}
CAPTION_STYLE = {
    "preset": "highlight-word",
    "fontSize": 60,
    "maxCharsPerLine": 26,
    "maxLines": 2,
    "safeTop": 1350,
    "safeBottom": 1650,
}
# camelCase / PascalCase with an inner capital, dotted or called identifiers, operators
CODE_RE = re.compile(r"[a-z][A-Z]|^[A-Z][a-z]+[A-Z]|\w[._]\w|\(\)|[<>{}=]")


def is_code(text: str) -> bool:
    return bool(CODE_RE.search(text.strip(".,!?;:\"'")))


@cache
def _schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate(doc: dict) -> None:
    """JSON Schema shape check, then the cross-field rules Zod's superRefine enforces in TS."""
    jsonschema.validate(doc, _schema())
    for track in doc["tracks"]:
        for item in track["items"]:
            if item["start"] + item["duration"] > doc["duration"] + 1e-3:
                raise jsonschema.ValidationError(f"item {item['id']} ends after the composition")
            if item["type"] == "video":
                if item["assetId"] not in doc["assets"]:
                    raise jsonschema.ValidationError(f"unknown asset {item['assetId']}")
                if abs(item["sourceEnd"] - item["sourceStart"] - item["duration"]) > 1e-3:
                    raise jsonschema.ValidationError("duration must equal sourceEnd - sourceStart")


def caption_words(words: list[dict], start: float, end: float) -> list[dict]:
    """Transcript words inside [start, end] on the clip clock; merged/blank corrections are dropped."""
    out = []
    for w in sorted(words, key=lambda w: w["start_s"]):
        text = (w.get("corrected_text") or "").strip()
        mid = (w["start_s"] + w["end_s"]) / 2
        if not text or not start <= mid <= end:
            continue
        s = round(max(w["start_s"] - start, 0.0), 3)
        e = round(min(w["end_s"] - start, end - start), 3)
        out.append({"text": text, "start": s, "end": max(e, s), "isCode": is_code(text)})
    return out


def build(
    highlight: dict, recording: dict, words: list[dict], render_id: str, quality: str = "looks"
) -> dict:
    start, end = float(highlight["start_s"]), float(highlight["end_s"])
    duration = round(end - start, 3)
    keyframes = highlight.get("crop_keyframes") or []
    if not keyframes:  # centred 9:16 window
        cw = int(round(recording["height"] * 9 / 16 / 2) * 2)
        keyframes = [
            {
                "t": 0.0,
                "crop_x": (recording["width"] - cw) // 2,
                "crop_y": 0,
                "crop_width": cw,
                "crop_height": recording["height"],
                "layout": "crop",
                "region": "hold",
                "transition_mode": "start",
            }
        ]
    keyframes = [{**k, "t": min(max(float(k["t"]), 0.0), duration)} for k in keyframes]
    doc = {
        "id": render_id,
        "schemaVersion": 1,
        "fps": 30,
        "width": W,
        "height": H,
        "duration": duration,
        "source": {"recordingId": recording["id"], "highlightId": highlight["id"]},
        "assets": {
            "source": {
                "id": "source",
                "kind": "video",
                "src": "source" + Path(recording["filename"]).suffix.lower(),
                "width": recording["width"],
                "height": recording["height"],
                "duration": recording.get("duration_s") or end,
            }
        },
        "tracks": [
            {
                "id": "video",
                "kind": "video",
                "items": [
                    {
                        "id": "clip",
                        "type": "video",
                        "assetId": "source",
                        "start": 0,
                        "duration": duration,
                        "sourceStart": start,
                        "sourceEnd": round(start + duration, 3),
                        "volume": 1,
                        "cropKeyframes": keyframes,
                    }
                ],
            },
            {
                "id": "captions",
                "kind": "caption",
                "items": [
                    {
                        "id": "captions",
                        "type": "caption",
                        "start": 0,
                        "duration": duration,
                        "words": caption_words(words, start, end),
                    }
                ],
            },
        ],
        "brand": DEFAULT_BRAND,
        "captionStyle": CAPTION_STYLE,
        "renderSettings": {"quality": quality},
    }
    validate(doc)
    return doc


def timeline_hash(doc: dict) -> str:
    """Identity of what would be rendered (ignores the render id) — the render cache key."""
    body = {k: v for k, v in doc.items() if k != "id"}
    return hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
