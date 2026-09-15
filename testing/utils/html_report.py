"""Renders TestReporter's dict (see reporter.py's to_dict()) as a single
self-contained HTML file -- no template engine, no external assets, so the
report still opens correctly if it's the only file someone downloads from CI.
"""
from __future__ import annotations

import html
import os

_ROW_TEMPLATE = """<tr class="{cls}">
  <td>{name}</td>
  <td>{endpoint}</td>
  <td>{outcome}</td>
  <td>{duration:.2f}s</td>
  <td>{reason}</td>
</tr>"""

_PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Munafa testing/ report</title>
<style>
  body {{ font-family: -apple-system, Segoe UI, sans-serif; margin: 2rem; color: #1a1a2e; }}
  h1 {{ margin-bottom: 0.25rem; }}
  .meta {{ color: #666; margin-bottom: 1.5rem; }}
  .summary {{ display: flex; gap: 1rem; margin-bottom: 2rem; }}
  .card {{ border: 1px solid #ddd; border-radius: 8px; padding: 1rem 1.5rem; min-width: 100px; }}
  .card .n {{ font-size: 1.75rem; font-weight: 700; }}
  .card.passed {{ border-color: #26A65B; }}
  .card.failed {{ border-color: #E74C3C; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }}
  tr.failed td {{ background: #fdecea; }}
  tr.skipped td {{ color: #999; }}
  code {{ background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 4px; }}
</style>
</head>
<body>
  <h1>Munafa testing/ report</h1>
  <div class="meta">Generated from a pytest run &middot; {duration_seconds:.1f}s total</div>
  <div class="summary">
    <div class="card"><div class="n">{total}</div>total</div>
    <div class="card passed"><div class="n">{passed}</div>passed</div>
    <div class="card failed"><div class="n">{failed}</div>failed</div>
    <div class="card"><div class="n">{skipped}</div>skipped</div>
    <div class="card"><div class="n">{pass_rate}%</div>pass rate</div>
  </div>
  <table>
    <thead><tr><th>Test</th><th>Endpoint</th><th>Outcome</th><th>Duration</th><th>Reason</th></tr></thead>
    <tbody>
      {rows}
    </tbody>
  </table>
</body>
</html>
"""


def render_html(report: dict) -> str:
    rows = "\n      ".join(
        _ROW_TEMPLATE.format(
            cls=result["outcome"],
            name=html.escape(result["name"]),
            endpoint=html.escape(result.get("endpoint") or "-"),
            outcome=result["outcome"],
            duration=result["duration"],
            reason=html.escape(result["reason"] or "-"),
        )
        for result in report["results"]
    )
    return _PAGE_TEMPLATE.format(rows=rows or "<tr><td colspan=5>No tests ran.</td></tr>", **report["summary"])


def write_html(report: dict, path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(render_html(report))
