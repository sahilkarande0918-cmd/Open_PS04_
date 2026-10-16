from app.services.screen_analysis.ocr import code_identifiers
from app.services.transcription.glossary import correct_with_screen


def words(text: str, t0: float = 100.0) -> list[dict]:
    return [
        {"idx": i, "raw_text": t, "corrected_text": t, "start_s": t0 + i * 0.4, "end_s": t0 + i * 0.4 + 0.3}
        for i, t in enumerate(text.split())
    ]


def shown(ws):
    return " ".join(w["corrected_text"] for w in ws if w["corrected_text"])


SEEN = [(95.0, "AbortController"), (96.0, "setData"), (96.0, "useState")]


def test_identifiers_from_ocr_text():
    assert code_identifiers("const controller = new AbortController();") == {"AbortController"}
    assert "setData" in code_identifiers("const [data, setData] = useState(null);")
    assert code_identifiers("@Autowired private Repo repo;") >= {"@Autowired"}


def test_mishearing_fixed_only_with_screen_evidence():
    out = correct_with_screen(words("ek naya about controller banayenge"), SEEN)
    assert shown(out) == "ek naya AbortController banayenge"
    meta = out[2]["metadata"]["correction"]
    assert meta["source"] == "screen-ocr" and meta["frame_s"] == 95.0
    assert out[2]["raw_text"] == "about" and out[3]["metadata"]["merged_into"] == 2


def test_no_evidence_no_change():
    # same words, but the identifier was on screen 5 minutes earlier
    out = correct_with_screen(words("ek naya about controller banayenge", t0=400.0), SEEN)
    assert shown(out) == "ek naya about controller banayenge"


def test_user_edits_win():
    ws = words("ek naya about controller")
    ws[2]["metadata"] = {"edited": True}
    assert shown(correct_with_screen(ws, SEEN)) == "ek naya about controller"


def test_regressions_from_lecture_run():
    # Hindi "se" (from) + "data" must not be merged into setData, even with setData on screen
    assert shown(correct_with_screen(words("Hook se data nikalenge"), SEEN)) == "Hook se data nikalenge"
    # a leading Hindi word must not be swallowed into the identifier
    assert (
        shown(correct_with_screen(words("To about controller wala pattern"), SEEN))
        == "To AbortController wala pattern"
    )
