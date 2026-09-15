"""Unit tests for ResponseValidator -- no network calls. These build a real
requests.Response object by hand (rather than a stubbed duck-type) so the
assertions are exercised against the same object shape a live call returns.
"""
import json

import pytest
from requests.models import Response

from utils.validators import ResponseValidator


def make_response(status_code=200, json_body=None, content_type="application/json", elapsed_seconds=0.1):
    resp = Response()
    resp.status_code = status_code
    resp.headers["Content-Type"] = content_type
    resp.url = "https://example.test/api/yahoo/v8/finance/chart/RELIANCE.NS"
    if json_body is not None:
        resp._content = json.dumps(json_body).encode("utf-8")
    else:
        resp._content = b""
    from datetime import timedelta

    resp.elapsed = timedelta(seconds=elapsed_seconds)
    return resp


VALID_CHART_BODY = {
    "chart": {
        "result": [{"meta": {"symbol": "RELIANCE.NS", "regularMarketPrice": 2500.0}}],
        "error": None,
    }
}

ERROR_CHART_BODY = {
    "chart": {"result": None, "error": {"code": "Not Found", "description": "No data found"}}
}


def test_assert_status_code_passes_for_expected():
    ResponseValidator.assert_status_code(make_response(200), 200)


def test_assert_status_code_accepts_set():
    ResponseValidator.assert_status_code(make_response(404), {200, 404})


def test_assert_status_code_fails_for_unexpected():
    with pytest.raises(AssertionError):
        ResponseValidator.assert_status_code(make_response(500), 200)


def test_assert_is_json_parses_body():
    data = ResponseValidator.assert_is_json(make_response(json_body=VALID_CHART_BODY))
    assert data == VALID_CHART_BODY


def test_assert_is_json_rejects_non_json_content_type():
    with pytest.raises(AssertionError):
        ResponseValidator.assert_is_json(make_response(content_type="text/html"))


def test_assert_has_path_walks_nested_dict_and_list():
    value = ResponseValidator.assert_has_path(VALID_CHART_BODY, "chart.result.0.meta.symbol")
    assert value == "RELIANCE.NS"


def test_assert_has_path_reports_missing_segment():
    with pytest.raises(AssertionError, match="chart.result.0.doesnotexist"):
        ResponseValidator.assert_has_path(VALID_CHART_BODY, "chart.result.0.doesnotexist")


def test_assert_valid_chart_response_accepts_result_shape():
    ResponseValidator.assert_valid_chart_response(VALID_CHART_BODY)


def test_assert_valid_chart_response_accepts_error_shape():
    ResponseValidator.assert_valid_chart_response(ERROR_CHART_BODY)


def test_assert_valid_chart_response_rejects_neither():
    with pytest.raises(AssertionError):
        ResponseValidator.assert_valid_chart_response({"chart": {"result": None, "error": None}})


def test_assert_response_time_under_threshold():
    ResponseValidator.assert_response_time_under(make_response(elapsed_seconds=0.5), 1.0)
    with pytest.raises(AssertionError):
        ResponseValidator.assert_response_time_under(make_response(elapsed_seconds=2.0), 1.0)


def test_assert_no_server_error():
    ResponseValidator.assert_no_server_error(make_response(404))
    with pytest.raises(AssertionError):
        ResponseValidator.assert_no_server_error(make_response(502))
