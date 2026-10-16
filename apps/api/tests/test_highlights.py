from app.services.highlights.candidates import Candidate, select, sentences, windows


def speech(spec: list[tuple[str, float]], t0: float = 0.0) -> list[dict]:
    """spec: (sentence text, pause after). Words 0.4 s each."""
    out, t = [], t0
    for text, pause in spec:
        toks = text.split()
        for j, tok in enumerate(toks):
            out.append(
                {"idx": len(out), "raw_text": tok, "corrected_text": tok, "start_s": t, "end_s": t + 0.35}
            )
            t += 0.4
        t += pause
    return out


def test_sentences_split_on_punctuation_and_long_pauses():
    ws = speech(
        [("ab hum hook banayenge.", 0.2), ("phir state banayenge", 1.2), ("aur effect likhenge.", 0.3)]
    )
    ss = sentences(ws)
    assert [(s.start, s.end) for s in ss] == [(0, 3), (4, 6), (7, 9)]
    assert ss[1].pause_after >= 1.2


def test_windows_respect_30_to_60_seconds_and_sentence_boundaries():
    # 20 sentences of ~4.8 s (12 words) separated by 0.6 s pauses
    ws = speech([("w " * 11 + "end.", 0.6)] * 20)
    ss = sentences(ws)
    for a, b in windows(ss):
        d = ss[b].end_s - ss[a].start_s
        assert 30 <= d <= 60
        # every window begins at a sentence start and ends at a sentence end
        assert ws[ss[a].start]["start_s"] == ss[a].start_s and ws[ss[b].end]["corrected_text"].endswith(".")


def test_nms_keeps_best_non_overlapping():
    a = Candidate(0, 45, 0, 0, "a", score=0.9)
    b = Candidate(5, 50, 0, 0, "b", score=0.8)  # mostly overlaps a
    c = Candidate(60, 100, 0, 0, "c", score=0.5)
    assert [x.text for x in select([a, b, c])] == ["a", "c"]
