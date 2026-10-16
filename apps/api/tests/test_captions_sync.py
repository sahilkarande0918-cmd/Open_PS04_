import numpy as np

from app.services.rendering import captions, sync, timeline

REC = {"id": "rec-1", "filename": "c.mp4", "width": 1920, "height": 1080, "duration_s": 100}
KF = {
    "t": 0,
    "crop_x": 0,
    "crop_y": 0,
    "crop_width": 608,
    "crop_height": 1080,
    "layout": "crop",
    "region": "a",
    "transition_mode": "start",
}


def doc_with(words, kit=None):
    h = {"id": "h", "start_s": 10.0, "end_s": 20.0, "crop_keyframes": [KF], "title": "T"}
    ws = [{"start_s": s, "end_s": e, "raw_text": t, "corrected_text": t} for t, s, e in words]
    return timeline.build(h, REC, ws, "r", kit=kit)


def test_srt_and_vtt_cues_follow_pages_and_intro_offset():
    kit = {
        "id": "k",
        "name": "K",
        "handle": "",
        "colors": {"background": "#000000", "text": "#ffffff", "accent": "#ffcc00"},
        "fonts": {"body": "Archivo", "code": "JetBrains Mono"},
        "watermark": {"enabled": False, "position": "top-right"},
        "caption_preset": "highlight-word",
        "intro": {"enabled": True, "duration": 2, "title": ""},
        "outro": {"enabled": False, "duration": 3, "cta": ""},
    }
    doc = doc_with(
        [("Use", 10.5, 10.8), ("<div>", 10.8, 11.2), ("tags.", 11.2, 11.6), ("Next", 15.0, 15.4)], kit
    )
    srt = captions.srt(doc)
    assert srt.startswith("1\n00:00:02,500 --> ")  # 0.5 s into the clip + 2 s intro
    assert "Use <div> tags." in srt and "\n2\n00:00:07,000 --> " in srt
    vtt = captions.vtt(doc)
    assert vtt.startswith("WEBVTT\n\n00:00:02.500 --> ") and "Use &lt;div&gt; tags." in vtt


def test_no_words_gives_empty_but_valid_files():
    doc = doc_with([])
    assert captions.srt(doc) == "" and captions.vtt(doc) == "WEBVTT\n\n"


def test_audio_offset_finds_a_known_shift_and_its_sign():
    rng = np.random.default_rng(7)
    ref = rng.standard_normal(sync.SR * 3).astype(np.float32)
    late = np.concatenate([np.zeros(int(0.12 * sync.SR), np.float32), ref])[: len(ref)]
    offset, peak = sync.audio_offset(ref, late)
    assert abs(offset - 0.12) < 0.002 and peak > 0.8
    assert abs(sync.audio_offset(ref, ref)[0]) < 1e-6


def test_words_on_speech_detects_words_in_silence():
    sr = sync.SR
    audio = np.zeros(sr * 4, np.float32)
    audio[sr : 2 * sr] = 0.3 * np.sin(np.linspace(0, 2 * np.pi * 220, sr))  # speech-like tone 1–2 s
    on = [{"start": 1.2, "end": 1.5}, {"start": 1.6, "end": 1.9}]
    off = [{"start": 3.0, "end": 3.3}]
    assert sync.words_on_speech(audio, on) == 1.0
    assert sync.words_on_speech(audio, on + off) == 2 / 3
