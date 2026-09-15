"""Root pytest config.

Puts testing/ itself on sys.path (so `from utils.api_client import APIClient`
and `from config import BASE_URL` work no matter what directory pytest is
invoked from), and wires up TestReporter as a session-wide collector via
pytest's hook system so every test run -- unit, integration, api, generated
-- ends up in one JSON report.
"""
from __future__ import annotations

import os
import sys

import pytest

TESTING_DIR = os.path.dirname(os.path.abspath(__file__))
if TESTING_DIR not in sys.path:
    sys.path.insert(0, TESTING_DIR)

from utils.api_client import APIClient  # noqa: E402
from utils.reporter import TestReporter  # noqa: E402

REPORT_PATH = os.path.join(TESTING_DIR, "reports", "latest.json")


@pytest.fixture(scope="session")
def api_client():
    client = APIClient()
    yield client
    client.close()


@pytest.fixture(scope="session")
def reporter(request) -> TestReporter:
    return request.config._munafa_reporter


@pytest.fixture
def endpoint_recorder(request):
    """Lets a test tag which endpoint it exercised, so the JSON report's
    failure list says *what* broke, not just which test function did."""

    def _record(path: str) -> None:
        request.node._endpoint_under_test = path

    return _record


def pytest_configure(config: pytest.Config) -> None:
    config._munafa_reporter = TestReporter()
    config.addinivalue_line("markers", "security: marks tests probing injection/auth-bypass style inputs")
    config.addinivalue_line("markers", "ai_generated: marks tests written by the AI test-case generator")


def pytest_runtest_makereport(item: pytest.Item, call: pytest.CallInfo) -> None:
    if call.when != "call" and not (call.when == "setup" and call.excinfo):
        return
    reporter: TestReporter = item.config._munafa_reporter
    outcome = "passed"
    reason = None
    if call.excinfo is not None:
        if call.excinfo.errisinstance(pytest.skip.Exception):
            outcome = "skipped"
        else:
            outcome = "failed"
        reason = str(call.excinfo.value)
    endpoint = getattr(item, "_endpoint_under_test", "")
    reporter.add_result(name=item.nodeid, outcome=outcome, duration=call.duration, reason=reason, endpoint=endpoint)


def pytest_sessionfinish(session: pytest.Session) -> None:
    reporter: TestReporter = session.config._munafa_reporter
    reporter.write_json(REPORT_PATH)
    summary = reporter.summary()
    print(
        f"\n[TestReporter] {summary['passed']}/{summary['total']} passed "
        f"({summary['pass_rate']}%) -> {REPORT_PATH}"
    )
