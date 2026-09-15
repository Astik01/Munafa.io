"""Unit tests for retry_on_transient_failure -- fakes the wrapped function
so no real network or real sleeping happens; time.sleep is monkeypatched to
a no-op so retry/backoff logic can be verified in milliseconds."""
import requests
import pytest

from utils import retry as retry_module
from utils.retry import RetryExhausted, retry_on_transient_failure


@pytest.fixture(autouse=True)
def no_real_sleep(monkeypatch):
    monkeypatch.setattr(retry_module.time, "sleep", lambda seconds: None)


def make_response(status_code: int) -> requests.Response:
    r = requests.Response()
    r.status_code = status_code
    return r


def test_returns_immediately_on_success():
    calls = []

    @retry_on_transient_failure(max_attempts=3)
    def flaky():
        calls.append(1)
        return make_response(200)

    response = flaky()
    assert response.status_code == 200
    assert len(calls) == 1


def test_retries_on_transient_status_then_succeeds():
    responses = iter([make_response(429), make_response(429), make_response(200)])

    @retry_on_transient_failure(max_attempts=3, base_delay=0.01)
    def flaky():
        return next(responses)

    response = flaky()
    assert response.status_code == 200


def test_raises_retry_exhausted_when_always_transient():
    @retry_on_transient_failure(max_attempts=3, base_delay=0.01)
    def always_429():
        return make_response(429)

    with pytest.raises(RetryExhausted):
        always_429()


def test_non_transient_status_returns_without_retrying():
    calls = []

    @retry_on_transient_failure(max_attempts=3)
    def not_found():
        calls.append(1)
        return make_response(404)

    response = not_found()
    assert response.status_code == 404
    assert len(calls) == 1  # never retried -- 404 isn't transient


def test_retries_on_connection_error_then_succeeds():
    attempts = {"n": 0}

    @retry_on_transient_failure(max_attempts=3, base_delay=0.01)
    def flaky():
        attempts["n"] += 1
        if attempts["n"] < 2:
            raise requests.ConnectionError("boom")
        return make_response(200)

    response = flaky()
    assert response.status_code == 200
    assert attempts["n"] == 2


def test_raises_retry_exhausted_after_repeated_timeouts():
    @retry_on_transient_failure(max_attempts=2, base_delay=0.01)
    def always_times_out():
        raise requests.Timeout("too slow")

    with pytest.raises(RetryExhausted):
        always_times_out()
