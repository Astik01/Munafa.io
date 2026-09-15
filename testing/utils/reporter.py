"""Collects per-test outcomes during a pytest run and produces a structured
JSON report. Wired into pytest via the hooks in conftest.py (pytest_runtest_makereport
/ pytest_sessionfinish) rather than being called directly by test code.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass, field


@dataclass
class TestResult:
    __test__ = False  # not a pytest test class despite the name

    name: str
    endpoint: str
    outcome: str  # "passed" | "failed" | "skipped"
    duration: float
    reason: str | None = None


@dataclass
class TestReporter:
    __test__ = False  # not a pytest test class despite the name

    results: list[TestResult] = field(default_factory=list)
    started_at: float = field(default_factory=time.time)

    def add_result(self, name: str, outcome: str, duration: float, reason: str | None = None, endpoint: str = "") -> None:
        self.results.append(TestResult(name=name, endpoint=endpoint, outcome=outcome, duration=duration, reason=reason))

    def summary(self) -> dict:
        total = len(self.results)
        passed = sum(1 for r in self.results if r.outcome == "passed")
        failed = sum(1 for r in self.results if r.outcome == "failed")
        skipped = sum(1 for r in self.results if r.outcome == "skipped")
        pass_rate = round((passed / total) * 100, 2) if total else 0.0
        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "pass_rate": pass_rate,
            "duration_seconds": round(time.time() - self.started_at, 2),
        }

    def failures(self) -> list[dict]:
        return [asdict(r) for r in self.results if r.outcome == "failed"]

    def to_dict(self) -> dict:
        return {
            "summary": self.summary(),
            "failures": self.failures(),
            "results": [asdict(r) for r in self.results],
        }

    def write_json(self, path: str) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)
