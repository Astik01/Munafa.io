"""Unit tests for TestReporter's aggregation math and JSON output shape."""
import json
import os

from utils.reporter import TestReporter


def test_summary_counts_and_pass_rate():
    r = TestReporter()
    r.add_result("t1", "passed", 0.1)
    r.add_result("t2", "passed", 0.1)
    r.add_result("t3", "failed", 0.1, reason="boom")
    r.add_result("t4", "skipped", 0.0)

    summary = r.summary()
    assert summary["total"] == 4
    assert summary["passed"] == 2
    assert summary["failed"] == 1
    assert summary["skipped"] == 1
    assert summary["pass_rate"] == 50.0


def test_summary_pass_rate_with_no_results_is_zero_not_a_crash():
    assert TestReporter().summary()["pass_rate"] == 0.0


def test_failures_includes_reason_and_endpoint():
    r = TestReporter()
    r.add_result("t1", "failed", 0.2, reason="500 error", endpoint="/api/yahoo/v8/finance/chart/RELIANCE.NS")
    [failure] = r.failures()
    assert failure["reason"] == "500 error"
    assert failure["endpoint"] == "/api/yahoo/v8/finance/chart/RELIANCE.NS"


def test_write_json_produces_loadable_report(tmp_path):
    r = TestReporter()
    r.add_result("t1", "passed", 0.1)
    out_path = os.path.join(tmp_path, "nested", "report.json")

    r.write_json(out_path)

    with open(out_path) as f:
        data = json.load(f)
    assert data["summary"]["total"] == 1
    assert data["results"][0]["name"] == "t1"
