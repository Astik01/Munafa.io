"""Reusable assertions over `requests.Response` objects and Yahoo chart JSON
payloads. Centralizing these means a schema tweak (or a Yahoo API change)
gets fixed in one place instead of in every test file.
"""
from __future__ import annotations

from typing import Any

import requests


class ResponseValidator:
    __test__ = False

    @staticmethod
    def assert_status_code(response: requests.Response, expected: int | set[int]) -> None:
        expected_set = expected if isinstance(expected, set) else {expected}
        assert response.status_code in expected_set, (
            f"expected status in {expected_set}, got {response.status_code} "
            f"for {response.url}: {response.text[:300]}"
        )

    @staticmethod
    def assert_is_json(response: requests.Response) -> dict:
        content_type = response.headers.get("Content-Type", "")
        assert "json" in content_type, f"expected JSON content-type, got '{content_type}' for {response.url}"
        try:
            return response.json()
        except ValueError as exc:
            raise AssertionError(f"response body is not valid JSON: {response.text[:300]}") from exc

    @staticmethod
    def assert_has_path(data: dict, dotted_path: str) -> Any:
        """Walk a dotted path like 'chart.result' through nested dicts/lists
        (numeric segments index into lists) and return the value, or fail
        with the exact segment that went missing."""
        node = data
        walked = []
        for segment in dotted_path.split("."):
            walked.append(segment)
            key: Any = int(segment) if segment.isdigit() else segment
            if isinstance(node, list):
                assert isinstance(key, int) and -len(node) <= key < len(node), (
                    f"path '{'.'.join(walked)}' out of range for list of length {len(node)}"
                )
                node = node[key]
            elif isinstance(node, dict):
                assert key in node, f"path '{'.'.join(walked)}' missing; keys present: {list(node.keys())}"
                node = node[key]
            else:
                raise AssertionError(f"path '{'.'.join(walked)}' hit non-container value {node!r}")
        return node

    @staticmethod
    def assert_valid_chart_response(data: dict) -> None:
        """A well-formed Yahoo chart payload always has chart.result[0].meta
        with ohlc arrays, OR chart.error describing why it doesn't -- never
        neither."""
        ResponseValidator.assert_has_path(data, "chart")
        chart = data["chart"]
        has_result = bool(chart.get("result"))
        has_error = chart.get("error") is not None
        assert has_result or has_error, "chart payload has neither 'result' nor 'error'"
        if has_result:
            meta = ResponseValidator.assert_has_path(data, "chart.result.0.meta")
            for field in ("symbol", "regularMarketPrice"):
                assert field in meta, f"chart.result[0].meta missing '{field}'"

    @staticmethod
    def assert_valid_error_response(data: dict) -> None:
        ResponseValidator.assert_has_path(data, "chart")
        assert data["chart"].get("error") is not None, "expected chart.error for an invalid-input response"

    @staticmethod
    def assert_response_time_under(response: requests.Response, seconds: float) -> None:
        assert response.elapsed.total_seconds() < seconds, (
            f"response took {response.elapsed.total_seconds():.2f}s, expected under {seconds}s"
        )

    @staticmethod
    def assert_no_server_error(response: requests.Response) -> None:
        """Invalid/malicious input should be rejected (4xx) or produce a
        normal chart.error payload -- it should never 500 the upstream."""
        assert response.status_code < 500, (
            f"got a {response.status_code} server error for {response.url}: {response.text[:300]}"
        )
