"""SRT / WebVTT from a timeline's caption track. Cues are the same pages the renderer burns in, on the
composition clock (so they line up with the exported MP4, intro included)."""

from app.services.rendering.compose import paginate


def cues(doc: dict) -> list[tuple[float, float, str]]:
    style = doc["captionStyle"]
    result = []
    for item in (i for t in doc["tracks"] for i in t["items"] if i["type"] == "caption"):
        pages = paginate(item["words"], style["maxCharsPerLine"], style["maxLines"], item["duration"])
        result.extend(
            (item["start"] + p["start"], item["start"] + p["end"],
             "\n".join(" ".join(w["text"] for w in line) for line in p["lines"]))
            for p in pages
        )
    return sorted(result, key=lambda cue: cue[0])


def _ts(t: float, sep: str) -> str:
    ms = round(t * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def srt(doc: dict) -> str:
    return "".join(
        f"{n}\n{_ts(a, ',')} --> {_ts(b, ',')}\n{text}\n\n" for n, (a, b, text) in enumerate(cues(doc), 1)
    )


def _vtt_text(text: str) -> str:
    """Cue text is markup in WebVTT: escape code such as `<div>` or `a && b`."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def vtt(doc: dict) -> str:
    body = "".join(f"{_ts(a, '.')} --> {_ts(b, '.')}\n{_vtt_text(text)}\n\n" for a, b, text in cues(doc))
    return "WEBVTT\n\n" + body
