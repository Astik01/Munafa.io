"""The contract the AI test-plan generator's output must satisfy.

Deliberately narrow and mechanical: every field maps directly to one of
ResponseValidator's assertions (see testing/utils/validators.py), so the plan
-> pytest conversion in generate_tests.py is a straight lookup table rather
than free-form code generation. That's also why the LLM is never asked to
write Python directly -- it decides *what* to test (inputs, edge cases,
expected outcomes), and this schema plus generate_tests.py's templating turns
that into code we can audit before it runs.
"""
from __future__ import annotations

import jsonschema

TEST_PLAN_SCHEMA = {
    "type": "object",
    "required": ["test_cases"],
    "properties": {
        "test_cases": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["id", "category", "description", "symbol", "params"],
                "properties": {
                    "id": {"type": "string", "pattern": "^[a-z0-9_]+$"},
                    "category": {"enum": ["functional", "boundary", "security", "error"]},
                    "description": {"type": "string"},
                    "symbol": {"type": ["string", "null"]},
                    "params": {
                        "type": "object",
                        "properties": {
                            "interval": {"type": ["string", "number", "boolean", "null"]},
                            "range": {"type": ["string", "number", "boolean", "null"]},
                        },
                    },
                    "expect_status_in": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "default": [200],
                    },
                    "expect_server_error": {"type": "boolean", "default": False},
                    "expect_chart_error": {"type": "boolean", "default": False},
                    "expect_no_reflection": {"type": "boolean", "default": False},
                },
                "additionalProperties": False,
            },
        }
    },
    "additionalProperties": False,
}


def validate_test_plan(plan: dict) -> None:
    """Raises jsonschema.ValidationError with a precise path on mismatch."""
    jsonschema.validate(instance=plan, schema=TEST_PLAN_SCHEMA)

    ids = [case["id"] for case in plan["test_cases"]]
    duplicates = {i for i in ids if ids.count(i) > 1}
    if duplicates:
        raise jsonschema.ValidationError(f"duplicate test case id(s): {sorted(duplicates)}")
