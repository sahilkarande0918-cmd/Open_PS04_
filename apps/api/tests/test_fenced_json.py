import json

import pytest
from pydantic import ValidationError

from app.services.generation.models import Storyboard
from app.services.generation.storyboard import unwrap_fence
from tests.test_generation import storyboard_data

BODY = json.dumps(storyboard_data())
FENCE = "`" * 3


@pytest.mark.parametrize(
    ("text", "ok"),
    [
        (f"{FENCE}json\n{BODY}\n{FENCE}", True),
        (f"{FENCE}\n{BODY}\n{FENCE}", True),
        (f"  {FENCE}JSON\r\n{BODY}\r\n{FENCE}  \n", True),
        (BODY, True),
        (f"Here is the storyboard:\n{FENCE}json\n{BODY}\n{FENCE}", False),  # prose is never stripped
        (f"{FENCE}json\n{BODY}\n{FENCE}\n{FENCE}json\n{{}}\n{FENCE}", False),  # two blocks are not merged
        (f"{FENCE}json\n{BODY}", False),  # unterminated fence
        (f"{FENCE}python\n{BODY}\n{FENCE}", False),  # only json/untagged fences
    ],
)
def test_only_one_full_reply_fence_is_unwrapped(text, ok):
    if ok:
        assert Storyboard.model_validate_json(unwrap_fence(text)).scenes[1].code == "<name>Ada</name>"
    else:
        with pytest.raises(ValidationError):
            Storyboard.model_validate_json(unwrap_fence(text))


def test_schema_sent_to_ollama_is_grammar_compatible():
    from app.services.generation.storyboard import ollama_schema

    schema = ollama_schema(Storyboard.model_json_schema())
    text = json.dumps(schema)
    assert "$ref" not in text and "$defs" not in schema
    assert not any(k in text for k in ("minLength", "maxLength", "minItems", "maxItems"))
    scene = schema["properties"]["scenes"]["items"]
    assert set(scene["required"]) == {"title", "narration", "code_language", "code"}
    assert scene["additionalProperties"] is False
    assert scene["properties"]["code_language"]["enum"] == ["json", "xml", "python", "text"]
