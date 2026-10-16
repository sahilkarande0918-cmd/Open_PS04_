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


def test_ollama_invalid_output_is_repaired_before_return(monkeypatch):
    from app.services.generation import TopicRequest, generate_storyboard

    replies = ["{}", json.dumps(storyboard_data())]
    def post(url, **kwargs):
        assert url.endswith('/api/chat')
        assert kwargs['json']['format']['type'] == 'object'
        return httpx.Response(200, request=httpx.Request('POST', url),
                              json={"message": {"content": replies.pop(0)}})
    monkeypatch.setattr(httpx, 'post', post)
    board = generate_storyboard(TopicRequest(topic="JSON vs XML"))
    assert board.scenes[1].code == '<name>Ada</name>'
    assert not replies


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
