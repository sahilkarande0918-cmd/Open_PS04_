from app.services.transcription.cleanup import remove_loops


def words(text: str) -> list[dict]:
    return [{"idx": i, "raw_text": t, "corrected_text": t} for i, t in enumerate(text.split())]


def shown(ws):
    return " ".join(w["corrected_text"] for w in ws if w["corrected_text"])


def test_collapses_real_loops_seen_on_gpu_runs():
    assert (
        shown(remove_loops(words("aapko bataen na. aap to aap to aap to aap")))
        == "aapko bataen na. aap to aap"
    )
    assert shown(remove_loops(words("na. Acko. Acko. Acko. Acko. Acko."))) == "na. Acko."
    out = remove_loops(words("Aap pandrah log hain. Aap pandrah log hain. Aap pandrah log hain."))
    assert shown(out) == "Aap pandrah log hain."
    assert out[4]["raw_text"] == "Aap" and out[4]["metadata"]["removed"] == "repetition-loop"


def test_keeps_natural_repetition():
    assert shown(remove_loops(words("haan haan dekhe hain"))) == "haan haan dekhe hain"
    assert shown(remove_loops(words("ek ek karke step by step"))) == "ek ek karke step by step"
