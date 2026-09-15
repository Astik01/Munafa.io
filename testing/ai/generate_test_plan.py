"""Step 2a: turn testing/spec/endpoints.json into a structured test PLAN
(what to test, not code) via Claude, then validate it against schema.py
before anything downstream trusts it.

Usage:
    python ai/generate_test_plan.py
    python ai/generate_test_plan.py --spec spec/endpoints.json --out generated/pending/test_plan.json

Run from the testing/ directory (same as pytest).
"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.client import AnthropicNotConfigured, call_claude_json  # noqa: E402
from ai.schema import validate_test_plan  # noqa: E402

SYSTEM_PROMPT = """You are a senior API test engineer. You will be given a JSON description \
of one HTTP endpoint. Produce a test PLAN as a single JSON object -- nothing else. No prose, \
no markdown, no code fences, no explanation before or after the JSON.

Output must match exactly this shape:
{
  "test_cases": [
    {
      "id": "lowercase_snake_case_unique_id",
      "category": "functional" | "boundary" | "security" | "error",
      "description": "one sentence, what this case checks and why",
      "symbol": "<a symbol string to send, or null to omit it>",
      "params": {"interval": "<value or null>", "range": "<value or null>"},
      "expect_status_in": [<one or more plausible HTTP status codes>],
      "expect_server_error": <true if this input might otherwise trigger a 5xx and that's what we're guarding against, else false>,
      "expect_chart_error": <true if the response should be Yahoo's chart.error shape rather than real data>,
      "expect_no_reflection": <true if this is a payload that must not be reflected unescaped in the response body>
    }
  ]
}

Cover, across the full set of cases:
- functional: a few realistic valid requests
- boundary: edge-of-range values for interval/range, very long or empty strings
- security: injection-style symbols (SQLi, XSS, path traversal, NoSQL operator payloads) -- \
the goal is proving they're handled safely, not that they succeed
- error: malformed or missing required params, invalid enum values, wrong types

Produce between 12 and 20 test cases total. Every id must be unique. Do not invent \
endpoints, parameters, or behavior not present in the input JSON."""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", default="spec/endpoints.json")
    parser.add_argument("--out", default="generated/pending/test_plan.json")
    args = parser.parse_args()

    with open(args.spec, encoding="utf-8") as f:
        spec = json.load(f)

    user_prompt = f"Endpoint spec:\n{json.dumps(spec, indent=2)}"

    try:
        plan = call_claude_json(SYSTEM_PROMPT, user_prompt)
    except AnthropicNotConfigured as exc:
        print(f"[generate_test_plan] {exc}", file=sys.stderr)
        return 2
    except ValueError as exc:
        print(f"[generate_test_plan] model did not return valid JSON: {exc}", file=sys.stderr)
        return 1

    try:
        validate_test_plan(plan)
    except Exception as exc:  # jsonschema.ValidationError
        print(f"[generate_test_plan] plan failed schema validation: {exc}", file=sys.stderr)
        return 1

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=2)

    print(f"[generate_test_plan] wrote {len(plan['test_cases'])} test cases -> {args.out}")
    print("[generate_test_plan] review the plan, then run: python ai/generate_tests.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
