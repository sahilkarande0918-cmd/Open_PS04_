"""Reframing scenarios required by the PS (Section 8), on synthetic activity tracks."""

from app.services.screen_analysis.reframe import plan

W, H = 1920, 1080
CROP = 608


def samples(fn, dur=20.0, fps=2.0):
    out = []
    for i in range(int(dur * fps)):
        t = i / fps
        box, change, cut = fn(t)
        out.append({"t": t, "change": change, "box": box, "cut": cut, "text": 0.03})
    return out


OCR = [{"t": 0.0, "items": [{"text": "const x = 1;", "box": [400, 100, 500, 30], "conf": 0.99}]}]


def centre(k):
    return k["crop_x"] + k["crop_width"] / 2


def test_static_screen_holds_on_text_not_centre_and_never_moves():
    ks = plan(samples(lambda t: (None, 0.0, False)), OCR, 0, 20, W, H)
    assert len(ks) == 1 and abs(centre(ks[0]) - 650) < 5  # text block centre, not screen centre (960)


def test_typing_on_the_right_moves_camera_smoothly():
    def act(t):  # instructor works on the left, then starts typing on the right
        return ((400, 500, 300, 30) if t < 5 else (1500, 500, 300, 30)), 0.002, False

    ks = plan(samples(act), OCR, 0, 20, W, H)
    xs = [centre(k) for k in ks]
    assert xs[0] < 700 and xs[-1] > 1400  # starts left, ends on the typing
    assert len(ks) >= 4  # got there in several eased steps, not one jump
    steps = [b - a for a, b in zip(xs, xs[1:], strict=False)]
    assert max(steps) <= 900 * 0.5 + 1  # speed cap per 0.5 s step


def test_rapid_cursor_jitter_inside_dead_zone_does_not_shake():
    jitter = lambda t: ((900 + (40 if int(t * 2) % 2 else -40), 500, 20, 20), 0.001, False)  # noqa: E731
    ks = plan(samples(jitter), OCR, 0, 20, W, H)
    assert len({k["crop_x"] for k in ks}) <= 2


def test_long_code_lines_use_readable_panel_instead_of_cutting_code():
    ks = plan(samples(lambda t: ((330, 400, 1100, 60), 0.003, False)), OCR, 0, 20, W, H)
    assert any(k["layout"] == "panel" and k["crop_width"] >= 1100 for k in ks)
    assert all(k["crop_width"] <= 1280 for k in ks)


def test_vertical_scrolling_keeps_horizontal_framing():
    scroll = lambda t: ((330, 60, 900, 900), 0.2, False)  # noqa: E731 — whole editor moves
    ks = plan(samples(scroll), OCR, 0, 20, W, H)
    assert len({k["crop_x"] for k in ks}) <= 2


def test_switching_windows_cuts_instead_of_panning():
    def sw(t):
        if t < 10:
            return (400, 300, 300, 30), 0.002, False
        return (1300, 300, 400, 300), (0.5 if t == 10 else 0.001), t == 10

    ks = plan(samples(sw), OCR, 0, 20, W, H)
    cut = [k for k in ks if k["transition_mode"] == "cut"]
    assert cut and abs(cut[0]["t"] - 10) < 0.01
    assert all(k["crop_x"] >= 0 and k["crop_x"] + k["crop_width"] <= W for k in ks)
