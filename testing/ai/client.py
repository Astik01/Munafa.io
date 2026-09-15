"""Thin wrapper around the Anthropic API for AI-assisted test-plan
generation. Kept separate from testing/utils/api_client.py because this one
talks to Anthropic, not to Munafa's own surface -- different dependency,
different failure modes, shouldn't share a class.
"""
from __future__ import annotations

import json
import re

import anthropic

from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class AnthropicNotConfigured(RuntimeError):
    pass


def _client() -> anthropic.Anthropic:
    if not ANTHROPIC_API_KEY:
        raise AnthropicNotConfigured(
            "ANTHROPIC_API_KEY is not set. Copy testing/.env.example to testing/.env "
            "and fill it in -- this step needs a real key, there's no offline fallback."
        )
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def call_claude_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict:
    """Sends one request, returns the parsed JSON object from the reply.

    Raises AnthropicNotConfigured if no API key, or ValueError if the model's
    reply isn't valid JSON (it's instructed to emit only JSON, but nothing
    stops an LLM from wrapping it in prose or a code fence, so both are
    tolerated before giving up)."""
    response = _client().messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = "".join(block.text for block in response.content if block.type == "text").strip()
    text = _JSON_FENCE_RE.sub("", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"model reply was not valid JSON after fence-stripping: {text[:500]}") from exc
