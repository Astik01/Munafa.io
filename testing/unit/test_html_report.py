"""Unit tests for utils/html_report.py's rendering."""
import os

from utils.html_report import render_html, write_html
from utils.reporter import TestReporter


def sample_report():
    r = TestReporter()
    r.add_result("test_ok", "passed", 0.12, endpoint="/api/yahoo/v8/finance/chart/RELIANCE.NS")
    r.add_result(
        "test_bad",
        "failed",
        1.5,
        reason="expected status in {200}, got 429",
        endpoint="/api/yahoo/v8/finance/chart/TCS.NS",
    )
    return r.to_dict()


def test_render_html_includes_summary_numbers():
    html_out = render_html(sample_report())
    assert ">1<" in html_out  # 1 passed, 1 failed each render as their own count
    assert "50.0%" in html_out


def test_render_html_escapes_test_names_and_reasons():
    report = sample_report()
    report["results"][1]["reason"] = "<script>alert(1)</script>"
    html_out = render_html(report)
    assert "<script>alert(1)</script>" not in html_out
    assert "&lt;script&gt;" in html_out


def test_render_html_handles_no_results():
    empty = TestReporter().to_dict()
    html_out = render_html(empty)
    assert "No tests ran." in html_out


def test_write_html_creates_file(tmp_path):
    out_path = os.path.join(tmp_path, "nested", "report.html")
    write_html(sample_report(), out_path)
    with open(out_path, encoding="utf-8") as f:
        content = f.read()
    assert "<html" in content
