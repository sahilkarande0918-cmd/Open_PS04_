"""Bounded local model input/output. Examples are syntax-checked, never executed."""

import ast
import json
import xml.etree.ElementTree as ET
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class TopicRequest(StrictModel):
    topic: str = Field(min_length=3, max_length=500)
    audience: str = Field(default="beginners", min_length=1, max_length=120)
    tone: Literal["clear", "energetic", "conversational"] = "clear"
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    language: Literal["en"] = "en"
    voice: Literal["af_heart", "af_bella", "am_adam"] = "af_heart"
    duration_s: int = Field(default=45, ge=30, le=60)


def _reject_constant(value: str):
    raise ValueError(f"Invalid JSON constant {value}")


class Scene(StrictModel):
    title: str = Field(min_length=1, max_length=80)
    narration: str = Field(min_length=5, max_length=1500)
    code_language: Literal["json", "xml", "python", "text"]
    code: str = Field(min_length=1, max_length=2500)

    @model_validator(mode="after")
    def syntax(self):
        try:
            if self.code_language == "json":
                json.loads(self.code, parse_constant=_reject_constant)
            elif self.code_language == "xml":
                if "<!DOCTYPE" in self.code.upper() or "<!ENTITY" in self.code.upper():
                    raise ValueError("XML DTDs and entity declarations are not allowed")
                ET.fromstring(self.code)
            elif self.code_language == "python":
                ast.parse(self.code)  # syntax only: never eval, exec, import or subprocess
        except (SyntaxError, ET.ParseError, RecursionError) as exc:
            raise ValueError(f"Invalid {self.code_language} syntax: {exc}") from exc
        return self


class Storyboard(StrictModel):
    title: str = Field(min_length=1, max_length=120)
    scenes: list[Scene] = Field(min_length=2, max_length=6)

