"""Build the shared canonical timeline using measured narration, no estimated clip lengths."""

from app.services.generation.models import Storyboard
from app.services.rendering.timeline import CAPTION_STYLE, CAPTION_ZONES, brand_snapshot, validate


def build_timeline(storyboard: Storyboard, narration: list, render_id: str, kit: dict | None = None,
                   logo_src: str | None = None, quality: str = "looks") -> dict:
    if len(narration) != len(storyboard.scenes):
        raise ValueError("Every scene must have measured narration")
    brand, preset = brand_snapshot(kit, storyboard.title)
    zone = CAPTION_ZONES[(kit or {}).get("caption_position") or "lower"]
    offset = brand["intro"]["duration"] if brand["intro"]["enabled"] else 0.0
    assets, audio, code, captions = {}, [], [], []
    if logo_src:
        assets["logo"] = {"id": "logo", "kind": "image", "src": logo_src}
        brand = {**brand, "logoAssetId": "logo"}
    for idx, (scene, spoken) in enumerate(zip(storyboard.scenes, narration, strict=True)):
        duration = round(spoken.duration_s, 3)
        aid = f"narration-{idx}"
        assets[aid] = {"id": aid, "kind": "audio", "src": spoken.audio_path.name, "duration": duration}
        audio.append({"id": aid, "type": "audio", "assetId": aid, "start": offset,
                      "duration": duration, "sourceStart": 0, "sourceEnd": duration, "volume": 1})
        code.append({"id": f"scene-{idx}", "type": "code", "start": offset, "duration": duration,
                     "language": scene.code_language, "title": scene.title, "code": scene.code,
                     "typingDuration": round(min(duration * .6, max(1, len(scene.code) / 25)), 3)})
        captions.append({"id": f"captions-{idx}", "type": "caption", "start": offset,
                         "duration": duration, "words": spoken.words})
        offset = round(offset + duration, 3)
    tail = brand["outro"]["duration"] if brand["outro"]["enabled"] else 0.0
    doc = {"id": render_id, "schemaVersion": 1, "fps": 30, "width": 1080, "height": 1920,
           "title": storyboard.title, "duration": round(offset + tail, 3), "source": {}, "assets": assets,
           "tracks": [{"id": "narration", "kind": "audio", "items": audio},
                      {"id": "scenes", "kind": "overlay", "items": code},
                      {"id": "captions", "kind": "caption", "items": captions}],
           "brand": brand,
           "captionStyle": {**CAPTION_STYLE, "preset": preset, "safeTop": zone[0], "safeBottom": zone[1]},
           "renderSettings": {"quality": quality}}
    validate(doc)
    return doc
