"""Retry-with-backoff for transient failures against Munafa's proxy --
connection errors, timeouts, and 429/502/503/504 responses. Kept separate
from APIClient so the policy is visible and unit-testable on its own instead
of buried inside request-building code.

This exists because of a real, observed condition (see spec/endpoints.json's
known_issues): the /api/yahoo/* proxy's edge rate limiter can trip on a
handful of requests within a couple of seconds. Without this, every api/
test that happens to run in a burst is flaky for a reason that has nothing
to do with the thing it's actually testing.
"""
from __future__ import annotations

import functools
import time

import requests

TRANSIENT_STATUS_CODES = {429, 502, 503, 504}


class RetryExhausted(RuntimeError):
    """Raised when every attempt failed. A test that hits this fails with a
    clear message instead of hanging or surfacing a raw connection error."""


def retry_on_transient_failure(max_attempts: int = 3, base_delay: float = 1.0, max_delay: float = 8.0):
    """Retries a function returning a requests.Response. Retries on
    ConnectionError/Timeout and on TRANSIENT_STATUS_CODES, with exponential
    backoff (base_delay * 2**attempt, capped at max_delay). Any other
    exception, or a non-transient status code, returns/raises immediately."""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    response = func(*args, **kwargs)
                except (requests.ConnectionError, requests.Timeout) as exc:
                    if attempt == max_attempts:
                        raise RetryExhausted(
                            f"{func.__name__} failed after {max_attempts} attempts (last error: {exc})"
                        ) from exc
                    time.sleep(min(base_delay * (2 ** (attempt - 1)), max_delay))
                    continue

                if response.status_code not in TRANSIENT_STATUS_CODES:
                    return response

                if attempt == max_attempts:
                    raise RetryExhausted(
                        f"{func.__name__} kept returning transient status "
                        f"{response.status_code} after {max_attempts} attempts"
                    )
                time.sleep(min(base_delay * (2 ** (attempt - 1)), max_delay))

        return wrapper

    return decorator
