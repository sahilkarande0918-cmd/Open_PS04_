"""Generation boundaries: parse only, validate model output, measured audio timing."""

import json
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError


def storyboard_data():
    return {"title": "JSON vs XML", "scenes": [
        {"title": "JSON", "narration": "JSON stores named values in a compact object.",
         "code_language": "json", "code": '{"name": "Ada"}'},
        {"title": "XML", "narration": "XML uses opening and closing tags to describe the same information.",
         "code_language": "xml", "code": '<name>Ada</name>'},
    ]}


def test_generation_request_rejects_unsupported_language_and_blank_topic():
    from app.services.generation import TopicRequest

    for values in ({"topic": "JSON", "language": "hi"}, {"topic": "   "}):
        with pytest.raises(ValidationError):
            TopicRequest.model_validate(values)


@pytest.mark.parametrize("language,code", [
    ("json", '{"x":}'), ("json", '{"x": NaN}'),
    ("xml", '<!DOCTYPE x [<!ENTITY x "boom">]><x>&x;</x>'),
    ("xml", '<x>'), ("python", 'def invalid('),
])
def test_storyboard_rejects_invalid_or_unsafe_syntax(language, code):
    from app.services.generation import Storyboard

    data = storyboard_data()
    data["scenes"][0].update(code_language=language, code=code)
    with pytest.raises(ValidationError):
        Storyboard.model_validate(data)


def test_python_is_parsed_never_executed(tmp_path):
    from app.services.generation import Storyboard

    marker = tmp_path / "executed.txt"
    data = storyboard_data()
    data["scenes"][0].update(code_language="python", code=f"open({str(marker)!r}, 'w').write('bad')")
    Storyboard.model_validate(data)
    assert not marker.exists()


def lesson_data():
    """A schema- and quality-valid 30 s storyboard (about 69 spoken words, distinct real code)."""
    return {"title": "JSON vs XML", "scenes": [
        {"title": "Two ways to save a user", "narration": "Your app must save a user and send it to "
         "another service. JSON and XML can both describe that same user.", "code_language": "text",
         "code": "user: Ada, age 36"},
        {"title": "Name and value pairs", "narration": "JSON writes each field as a quoted name with a "
         "value, inside braces. It maps directly onto objects in most languages.", "code_language": "json",
         "code": '{"name": "Ada", "age": 36}'},
        {"title": "Opening and closing tags", "narration": "XML wraps every value in an opening and a "
         "closing tag, so the same user takes more characters to describe.", "code_language": "xml",
         "code": "<user><name>Ada</name></user>"},
        {"title": "Choosing between them", "narration": "Pick JSON for web APIs. Choose XML when a system "
         "needs attributes or document schemas.", "code_language": "python",
         "code": 'fmt = "json"'},
    ]}


@pytest.mark.parametrize("fenced", [False, True])
def test_ollama_invalid_output_is_repaired_before_return(monkeypatch, fenced):
    from app.services.generation import TopicRequest, generate_storyboard

    valid = json.dumps(lesson_data())
    replies = ["{}", f"```json\n{valid}\n```" if fenced else valid]
    def post(url, **kwargs):
        assert url.endswith('/api/chat')
        assert kwargs['json']['format']['type'] == 'object'
        return httpx.Response(200, request=httpx.Request('POST', url),
                              json={"message": {"content": replies.pop(0) if len(replies) > 1 else replies[0]}})
    monkeypatch.setattr(httpx, 'post', post)
    board = generate_storyboard(TopicRequest(topic="JSON vs XML", duration_s=30))
    assert board.scenes[2].code == "<user><name>Ada</name></user>"
    assert len(replies) == 1


def test_quality_gates_send_weak_storyboards_back_for_repair():
    from app.services.generation.models import Storyboard, TopicRequest
    from app.services.generation.storyboard import quality_issues

    req = TopicRequest(topic="JSON vs XML", duration_s=30)
    assert quality_issues(Storyboard.model_validate(lesson_data()), req) == []
    thin = Storyboard.model_validate(storyboard_data())  # 19 words for a 30 s video
    assert any("words in total" in i for i in quality_issues(thin, req))
    repeated = lesson_data()
    for scene in repeated["scenes"]:
        scene.update(code_language="text", code="JSON: {} XML: <a/>")
    repeated["scenes"][0]["title"] = "Hook/Problem"
    issues = " ".join(quality_issues(Storyboard.model_validate(repeated), req))
    assert "same code" in issues and "at most one scene" in issues and "generic scene titles" in issues


def test_alignment_corrects_spelling_without_inventing_timing():
    from app.services.generation.narration import align_words

    words = [{"raw_text": "Jason", "start_s": 0.12, "end_s": 0.4},
             {"raw_text": "works.", "start_s": 0.5, "end_s": 0.9}]
    aligned = align_words("JSON works.", words, 1.0)
    assert aligned == [{"text": "JSON", "start": 0.12, "end": 0.4, "isCode": False},
                       {"text": "works.", "start": 0.5, "end": 0.9, "isCode": False}]
    with pytest.raises(ValueError, match="align"):
        align_words("JSON works.", [], 1.0)
    with pytest.raises(ValueError, match="align"):
        align_words("JSON works with tags.", words, 1.0)


def test_timeline_uses_measured_scene_durations_and_caption_offsets():
    from app.services.generation import NarratedScene, Storyboard, build_timeline

    board = Storyboard.model_validate(storyboard_data())
    narration = [NarratedScene(Path('scene-0.wav'), 3.25,
                              [{"text": "JSON", "start": 0.1, "end": 0.5, "isCode": False}]),
                 NarratedScene(Path('scene-1.wav'), 4.0,
                               [{"text": "XML", "start": 0.2, "end": 0.6, "isCode": False}])]
    doc = build_timeline(board, narration, 'test-render')
    assert doc['duration'] == 7.25
    audio = next(t for t in doc['tracks'] if t['kind'] == 'audio')['items']
    assert audio[1]['start'] == 3.25
    assert audio[1]['sourceEnd'] == 4.0
    captions = next(t for t in doc['tracks'] if t['kind'] == 'caption')['items']
    assert captions[1]['start'] == 3.25
    assert captions[1]['words'][0]['start'] == 0.2
    assert doc['assets']['narration-1']['src'] == 'scene-1.wav'


def test_generation_cache_is_bound_to_request(tmp_path, monkeypatch):
    from app.services.generation import Storyboard, TopicRequest, cached_storyboard
    from app.services.generation import storyboard

    monkeypatch.setattr(storyboard, 'generate_storyboard',
                        lambda request: Storyboard.model_validate(storyboard_data()))
    request = TopicRequest(topic="JSON vs XML")
    cached_storyboard(request, tmp_path)
    monkeypatch.setattr(storyboard, 'generate_storyboard', lambda _: pytest.fail('cache was ignored'))
    assert cached_storyboard(request, tmp_path).title == 'JSON vs XML'
    with pytest.raises(ValueError, match='request'):
        cached_storyboard(TopicRequest(topic="Python lists"), tmp_path)


def test_alignment_drops_stray_words_and_bounds_missed_ones():
    from app.services.generation.narration import align_words

    heard = [{"raw_text": "Jaison", "start_s": 0.1, "end_s": 0.5},
             {"raw_text": "forward", "start_s": 0.55, "end_s": 0.7},   # stray word, not in the script
             {"raw_text": "keeps", "start_s": 0.8, "end_s": 1.0},
             {"raw_text": "data", "start_s": 1.4, "end_s": 1.7},
             {"raw_text": "small", "start_s": 1.8, "end_s": 2.0},
             {"raw_text": "and", "start_s": 2.05, "end_s": 2.15},
             {"raw_text": "readable.", "start_s": 2.2, "end_s": 2.6}]
    words = align_words("JSON keeps your data small and readable.", heard, 3.0)
    assert [w["text"] for w in words] == ["JSON", "keeps", "your", "data", "small", "and", "readable."]
    your = words[2]
    assert 1.0 <= your["start"] < your["end"] <= 1.4   # missed word stays inside its measured gap
    assert all(a["end"] <= b["start"] + 0.02 for a, b in zip(words, words[1:]))
