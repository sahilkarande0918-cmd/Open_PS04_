import jsonschema
import pytest

from app.services.rendering import compose, timeline

REC = {"id": "rec-1", "filename": "Class.MP4", "width": 1920, "height": 1080, "duration_s": 192.5}


def word(text, s, e, corrected=None):
    return {
        "start_s": s,
        "end_s": e,
        "raw_text": text,
        "corrected_text": text if corrected is None else corrected,
    }


def highlight(**kw):
    kf = {
        "t": 0,
        "crop_x": 656,
        "crop_y": 0,
        "crop_width": 608,
        "crop_height": 1080,
        "layout": "crop",
        "region": "active",
        "transition_mode": "start",
    }
    return {"id": "h-1", "start_s": 10.0, "end_s": 20.0, "crop_keyframes": [kf], **kw}


def test_build_shifts_words_to_clip_clock_and_drops_merged():
    words = [
        word("before", 8, 9),
        word("use", 10.5, 10.8),
        word("effect", 10.8, 11.2, ""),
        word("useEffect", 11.2, 11.9),
        word("after", 21, 22),
    ]
    doc = timeline.build(highlight(), REC, words, "r-1")
    caps = doc["tracks"][1]["items"][0]["words"]
    assert [w["text"] for w in caps] == ["use", "useEffect"]
    assert caps[0]["start"] == 0.5 and caps[1]["isCode"] is True
    assert doc["duration"] == 10.0 and doc["assets"]["source"]["src"] == "source.mp4"


def test_validation_rejects_cross_field_errors():
    doc = timeline.build(highlight(), REC, [], "r-1")
    doc["tracks"][0]["items"][0]["sourceEnd"] = 25.0
    with pytest.raises(jsonschema.ValidationError):
        timeline.validate(doc)
    doc = timeline.build(highlight(), REC, [], "r-1")
    doc["assets"]["source"]["src"] = "../secret.mp4"
    with pytest.raises(jsonschema.ValidationError):
        timeline.validate(doc)


def test_hash_ignores_render_id_but_not_content():
    a = timeline.build(highlight(), REC, [], "r-1")
    b = timeline.build(highlight(), REC, [], "r-2")
    c = timeline.build(highlight(end_s=21.0), REC, [], "r-3")
    assert timeline.timeline_hash(a) == timeline.timeline_hash(b) != timeline.timeline_hash(c)


@pytest.mark.parametrize(
    ("text", "code"),
    [
        ("AbortController", True),
        ("useEffect,", True),
        ("res.json()", True),
        ("Kubernetes", False),
        ("data", False),
        ("URL", False),
    ],
)
def test_is_code(text, code):
    assert timeline.is_code(text) is code


def test_camera_geometry_matches_preview_rules():
    crop = compose.camera(
        {"t": 0, "crop_x": 656, "crop_y": 0, "crop_width": 608, "crop_height": 1080, "layout": "crop"},
        1080,
        1920,
    )
    assert crop["win"] == [0, 1920] and crop["cam"][0] == pytest.approx(-656 * 1920 / 1080, abs=0.01)
    panel = compose.camera(
        {"t": 0, "crop_x": 360, "crop_y": 60, "crop_width": 1200, "crop_height": 960, "layout": "panel"},
        1080,
        1920,
    )
    assert panel["win"] == [336, 864]  # centred at 40 % of the frame, above the caption zone
    assert panel["cam"] == [-324.0, -54.0, 0.9]


def test_camera_track_jumps_on_cut_and_layout_change():
    base = {"crop_x": 0, "crop_y": 0, "crop_width": 608, "crop_height": 1080, "layout": "crop", "region": "a"}
    kfs = [
        {**base, "t": 0, "transition_mode": "start"},
        {**base, "t": 1, "transition_mode": "ease"},
        {**base, "t": 2, "transition_mode": "cut"},
        {
            **base,
            "t": 3,
            "transition_mode": "ease",
            "layout": "panel",
            "crop_width": 1200,
            "crop_height": 960,
        },
    ]
    assert [c["jump"] for c in compose.camera_track(kfs, 1080, 1920)] == [True, False, True, True]


def test_paginate_respects_line_length_pauses_and_sentences():
    ws = [
        {"text": t, "start": i * 0.4, "end": i * 0.4 + 0.3, "isCode": False}
        for i, t in enumerate("one two three four five six seven eight nine ten.".split())
    ]
    ws.append({"text": "next", "start": 10.0, "end": 10.3, "isCode": False})
    pages = compose.paginate(ws, max_chars=14, max_lines=2, duration=12)
    for p in pages:
        assert len(p["lines"]) <= 2
        assert all(len(" ".join(w["text"] for w in line)) <= 14 for line in p["lines"])
    assert pages[-1]["lines"] == [[ws[-1]]]  # sentence end + long pause start a new page
    assert all(a["end"] <= b["start"] for a, b in zip(pages, pages[1:]))


def test_compiled_html_has_trimmed_audio_video_and_escaped_words():
    words = [word("<script>", 10.2, 10.6), word("AbortController", 11, 11.8)]
    html = compose.compile_html(timeline.build(highlight(), REC, words, "r-1"))
    assert 'data-media-start="10.0"' in html and 'data-has-audio="true"' in html
    assert "&lt;script&gt;" in html and "<script>\n" not in html.split("<body>")[1].split("<script>")[0]
    assert 'window.__timelines["main"] = tl' in html and 'class="w code"' in html


def test_brand_ink_picks_legible_text():
    assert compose.brand_ink("#f5a524") == "#141005"
    assert compose.brand_ink("#1e3a8a") == "#ffffff"


KIT = {
    "id": "kit-1",
    "name": "Nimbu Academy",
    "handle": "@nimbu.academy",
    "colors": {"background": "#102a43", "text": "#ffffff", "accent": "#ffd166"},
    "fonts": {"body": "Poppins", "code": "Fira Code"},
    "logo": None,
    "watermark": {"enabled": True, "position": "bottom-left"},
    "caption_preset": "karaoke",
    "intro": {"enabled": True, "duration": 2, "title": "Today: {title}"},
    "outro": {"enabled": True, "duration": 3, "cta": "Follow for daily React tips"},
}
PNG_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


def test_brand_kit_snapshot_offsets_clip_by_intro_and_adds_outro():
    words = [word("AbortController", 11, 11.8)]
    doc = timeline.build(
        highlight(title="Cleanup with AbortController"), REC, words, "r-1", kit=KIT, logo_src="logo-abc.png"
    )
    video, caps = doc["tracks"][0]["items"][0], doc["tracks"][1]["items"][0]
    assert doc["duration"] == 2 + 10 + 3
    assert video["start"] == 2 and caps["start"] == 2 and caps["words"][0]["start"] == 1.0  # clip-relative
    assert doc["brand"]["intro"]["title"] == "Today: Cleanup with AbortController"
    assert doc["brand"]["logoAssetId"] == "logo" and doc["assets"]["logo"]["src"] == "logo-abc.png"
    assert doc["captionStyle"]["preset"] == "karaoke" and doc["title"] == "Cleanup with AbortController"


def test_no_kit_means_no_intro_outro_or_watermark():
    doc = timeline.build(highlight(), REC, [], "r-1")
    assert doc["duration"] == 10.0 and doc["tracks"][0]["items"][0]["start"] == 0
    html = compose.compile_html(doc)
    assert 'id="intro"' not in html and 'id="outro"' not in html and 'id="mark"' not in html


def test_kit_changes_change_the_cache_key():
    a = timeline.build(highlight(), REC, [], "r-1", kit=KIT)
    b = timeline.build(
        highlight(), REC, [], "r-1", kit={**KIT, "colors": {**KIT["colors"], "accent": "#ef476f"}}
    )
    assert timeline.timeline_hash(a) != timeline.timeline_hash(b)


def test_logo_file_validates_and_names_by_content():
    name, data = timeline.logo_file(PNG_1PX)
    assert name.startswith("logo-") and name.endswith(".png") and data[:4] == b"\x89PNG"
    for bad in ["data:text/html;base64,PHNjcmlwdD4=", "data:image/png;base64,***", "https://x/logo.png"]:
        with pytest.raises(ValueError):
            timeline.logo_file(bad)


def test_branded_html_has_cards_watermark_fonts_and_shifted_times():
    words = [word("AbortController", 11, 11.8)]
    doc = timeline.build(highlight(title="Cleanup"), REC, words, "r-1", kit=KIT, logo_src="logo-abc.png")
    html = compose.compile_html(doc)
    assert 'data-start="2.0" data-duration="10.0"' in html  # video after the 2 s intro
    assert (
        'id="intro" class="card clip" data-start="0" data-duration="2.0"' in html and "Today: Cleanup" in html
    )
    assert (
        'id="outro" class="card clip" data-start="12.0" data-duration="3.0"' in html
        and "@nimbu.academy" in html
    )
    assert 'id="mark" class="clip" data-start="2.0"' in html and "bottom: 150px; left: 44px;" in html
    assert 'font-family: "Poppins"' in html and 'font-family: "Fira Code"' in html and '"Archivo"' not in html
    assert "[0, 3.0, 4.3, true]" in html  # clip 1.0 s → composition 3.0 s; held to page end
    assert '"off": null' in html  # karaoke words keep their spoken colour


def test_write_project_copies_only_the_fonts_used(tmp_path):
    doc = timeline.build(highlight(), REC, [], "r-1", kit=KIT)
    compose.write_project(doc, tmp_path)
    assert sorted(p.name for p in (tmp_path / "fonts").iterdir()) == [
        "fira-code-600.woff2",
        "poppins-700.woff2",
    ]
    assert (tmp_path / "gsap.min.js").stat().st_size > 50_000  # offline renders: no CDN
    assert '<script src="gsap.min.js"></script>' in (tmp_path / "index.html").read_text(encoding="utf-8")
