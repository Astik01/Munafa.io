"""Step 3: after a pytest run, send the structured failure list from
testing/reports/latest.json to Claude and print a plain-English summary --
what failed, a likely root-cause category, and what to check next.

This is advisory only: it never changes exit codes or hides the raw pytest
output, it's printed *alongside* it. If ANTHROPIC_API_KEY isn't set, this
degrades to a no-op rather than failing the run (see conftest.py's call site).

Usage:
    python ai/analyze_failures.py                       # reads reports/latest.json
    python ai/analyze_failures.py --report path/to.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.client import AnthropicNotConfigured, call_claude_text  # noqa: E402

SYSTEM_PROMPT = """You are a pragmatic API test failure triager. You will be given a JSON \
list of pytest failures against Munafa's Yahoo Finance proxy (test name, endpoint, and the \
assertion error text). Write a short plain-English report with exactly these sections:

1. What failed -- one line per distinct failure pattern, not one line per test (group tests \
that failed for the same reason).
2. Likely root cause category for each pattern -- choose from: auth, validation, rate-limit, \
upstream-data, network/timeout, test-bug, other. Say which and why in one sentence.
3. Suggested next investigation step for each pattern -- concrete and specific, not generic \
advice like "add more logging".

Keep it under 200 words total. No markdown headers, plain sentences with the section labels \
above. If the failures list is empty, just say so in one line."""


def summarize(report: dict) -> str:
    failures = report.get("failures", [])
    if not failures:
        return "No failures in this run -- nothing to analyze."
    user_prompt = f"Failures:\n{json.dumps(failures, indent=2)}"
    return call_claude_text(SYSTEM_PROMPT, user_prompt)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", default="reports/latest.json")
    args = parser.parse_args()

    if not os.path.exists(args.report):
        print(f"[analyze_failures] no report at {args.report} -- run pytest first", file=sys.stderr)
        return 1

    with open(args.report, encoding="utf-8") as f:
        report = json.load(f)

    try:
        print(summarize(report))
    except AnthropicNotConfigured as exc:
        print(f"[analyze_failures] {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
