from app.services.transcription.glossary import Glossary, correct


def words(text: str) -> list[dict]:
    return [
        {"idx": i, "raw_text": t, "start_s": float(i), "end_s": i + 0.5, "segment_idx": 0}
        for i, t in enumerate(text.split())
    ]


def shown(ws: list[dict]) -> str:
    return " ".join(w["corrected_text"] for w in ws if w["corrected_text"])


G = Glossary.build()


def test_multiword_terms_merge_and_keep_raw():
    out = correct(words("toh ab hum use effect ke andar at the rate autowired lagayenge"), G)
    assert shown(out) == "toh ab hum useEffect ke andar @Autowired lagayenge"
    assert out[3]["raw_text"] == "use" and out[4]["raw_text"] == "effect"  # raw preserved
    assert out[3]["end_s"] == out[4]["end_s"] and out[4]["metadata"]["merged_into"] == 3


def test_casing_and_punctuation_preserved():
    out = correct(words("kubernetes, docker aur json."), G)
    assert shown(out) == "Kubernetes, Docker aur JSON."


def test_fuzzy_only_for_distinctive_terms():
    out = correct(words("kubernetis cluster"), G)
    assert out[0]["corrected_text"] == "Kubernetes" and out[0]["metadata"]["correction"]["source"] in (
        "glossary",
        "fuzzy",
    )
    # common Hinglish words are never "corrected" into tech terms
    assert shown(correct(words("reach karo aur jaldi chalo"), G)) == "reach karo aur jaldi chalo"


def test_org_glossary_and_screen_tokens():
    g = Glossary.build(
        org_terms=[{"term": "CodeKraft", "aliases": ["code craft"]}], screen_tokens=["fetchUsers"]
    )
    assert (
        shown(correct(words("code craft mein fetch users call karo"), g))
        == "CodeKraft mein fetchUsers call karo"
    )


def test_unknown_words_untouched_and_no_correction_metadata():
    out = correct(words("yeh loop har element pe chalta hai"), G)
    assert all("correction" not in w["metadata"] for w in out)
