"""Contract tests for the /api/yahoo/* proxy -- Munafa's one real network
dependency (see testing/utils/api_client.py for why).

Most of these tests aren't actually about Yahoo's live data -- they're
about whether api_client/ResponseValidator handle the response shapes Yahoo
is documented to return for bad input (spec/endpoints.json's
`200_or_404_error` case: HTTP 200 or 404 with a chart.error body, not a
5xx) without a crash. Running that against the real deployment on every
invocation was both unnecessary and actively harmful: 4 symbols x several
missing/malformed-param cases x 7 injection payloads, all back-to-back
against Yahoo's unofficial, unpaid, undocumented-rate-limit endpoint (see
spec/endpoints.json's known_issues), reliably burns through the limit and
fails with RetryExhausted 429s that have nothing to do with a real
regression. So those cases are mocked here via api_client.session.get.

A couple of @pytest.mark.live smoke tests are kept to prove the real
end-to-end path still works against one real symbol. They're excluded from
the default `pytest` run (see pytest.ini) and the CI-gating job (see
.github/workflows/ci.yml) -- run them explicitly with `pytest -m live`,
mirroring how the Vitest live integration test is split out via
`npm run test:integration`.
"""
import json
import time
from datetime import timedelta

import pytest
from requests.models import Response

from utils.test_data_generator import TestDataGenerator
from utils.validators import ResponseValidator

pytestmark = pytest.mark.timeout(20)


def _endpoint(symbol: str) -> str:
    return f"/api/yahoo/v8/finance/chart/{symbol}"


# A real requests.Response built by hand (same approach as
# unit/test_validators.py's make_response) rather than a duck-typed stub, so
# mocked tests exercise the exact object shape a live call returns.
CHART_ERROR_BODY = {
    "chart": {
        "result": None,
        "error": {"code": "Not Found", "description": "No data found, symbol may be delisted"},
    }
}


def _mock_bad_input_response(status_code: int = 200) -> Response:
    resp = Response()
    resp.status_code = status_code
    resp.headers["Content-Type"] = "application/json"
    resp.url = "https://munafa-io.vercel.app" + _endpoint("MOCKED")
    resp._content = json.dumps(CHART_ERROR_BODY).encode("utf-8")
    resp.elapsed = timedelta(seconds=0.1)
    return resp


def _mock_upstream(monkeypatch, api_client, status_code: int = 200) -> None:
    """Makes api_client.get_raw/get_yahoo_chart return a canned
    "bad input, no server error" response instead of making a real HTTP
    call, for the tests below that are about our own handling of that
    shape, not about exercising Yahoo's live data."""
    response = _mock_bad_input_response(status_code)
    monkeypatch.setattr(api_client.session, "get", lambda *args, **kwargs: response)


# ---------------------------------------------------------------------------
# Mocked -- no real network call. See module docstring.
# ---------------------------------------------------------------------------


def test_invalid_symbol_does_not_500(api_client, endpoint_recorder, monkeypatch):
    symbol = TestDataGenerator.invalid_symbol()
    endpoint_recorder(_endpoint(symbol))
    _mock_upstream(monkeypatch, api_client)
    response = api_client.get_yahoo_chart(symbol)

    ResponseValidator.assert_no_server_error(response)
    data = ResponseValidator.assert_is_json(response)
    ResponseValidator.assert_valid_chart_response(data)


def test_empty_symbol_does_not_500(api_client, endpoint_recorder, monkeypatch):
    endpoint_recorder(_endpoint(""))
    _mock_upstream(monkeypatch, api_client)
    response = api_client.get_yahoo_chart(TestDataGenerator.empty_symbol())
    ResponseValidator.assert_no_server_error(response)


def test_excessively_long_symbol_does_not_500(api_client, endpoint_recorder, monkeypatch):
    symbol = TestDataGenerator.excessively_long_symbol()
    endpoint_recorder(_endpoint("A" * 20 + "..."))
    _mock_upstream(monkeypatch, api_client)
    response = api_client.get_yahoo_chart(symbol)
    ResponseValidator.assert_no_server_error(response)


@pytest.mark.parametrize("params", TestDataGenerator.missing_params_cases())
def test_missing_query_params_degrade_gracefully(api_client, endpoint_recorder, monkeypatch, params):
    endpoint_recorder(_endpoint(TestDataGenerator.valid_symbol()))
    _mock_upstream(monkeypatch, api_client)
    response = api_client.get_raw(_endpoint(TestDataGenerator.valid_symbol()), params=params)
    ResponseValidator.assert_no_server_error(response)


@pytest.mark.parametrize("params", TestDataGenerator.malformed_param_cases())
def test_malformed_query_params_do_not_500(api_client, endpoint_recorder, monkeypatch, params):
    endpoint_recorder(_endpoint(TestDataGenerator.valid_symbol()))
    _mock_upstream(monkeypatch, api_client)
    response = api_client.get_raw(_endpoint(TestDataGenerator.valid_symbol()), params=params)
    ResponseValidator.assert_no_server_error(response)


@pytest.mark.security
@pytest.mark.parametrize("payload", TestDataGenerator.injection_payloads())
def test_injection_style_symbols_are_handled_safely(api_client, endpoint_recorder, monkeypatch, payload):
    """Not an expectation that Yahoo's API is vulnerable -- it's a guardrail
    that the proxy path never turns a malicious symbol into a 5xx, and never
    echoes the raw payload back unescaped (a cheap reflected-XSS smoke
    test). Mocked: the app has no server-side handling of its own on this
    path (it's a pure rewrite straight to Yahoo -- see
    spec/endpoints.json), so a real call here would only spend rate-limit
    quota without exercising any code of ours."""
    endpoint_recorder(_endpoint("<injection payload>"))
    _mock_upstream(monkeypatch, api_client)
    response = api_client.get_raw(_endpoint(payload))

    ResponseValidator.assert_no_server_error(response)
    assert "<script>" not in response.text


# ---------------------------------------------------------------------------
# Live -- real network calls against the actual deployment. Kept to one
# real symbol each so `pytest -m live` doesn't reproduce the same burst
# this file used to send on every run. See module docstring for how these
# are kept out of the default/blocking run.
# ---------------------------------------------------------------------------


@pytest.mark.live
def test_valid_symbol_returns_chart_data(api_client, endpoint_recorder):
    symbol = TestDataGenerator.valid_symbol()
    endpoint_recorder(_endpoint(symbol))
    response = api_client.get_yahoo_chart(symbol, interval="1d", range_="5d")

    ResponseValidator.assert_status_code(response, 200)
    data = ResponseValidator.assert_is_json(response)
    ResponseValidator.assert_valid_chart_response(data)

    meta = data["chart"]["result"][0]["meta"]
    assert meta["symbol"] == symbol


@pytest.mark.live
def test_response_time_is_reasonable_for_a_single_symbol(api_client, endpoint_recorder):
    time.sleep(1)  # space this out from the live test above, not back-to-back
    symbol = TestDataGenerator.valid_symbol()
    endpoint_recorder(_endpoint(symbol))
    response = api_client.get_yahoo_chart(symbol)
    ResponseValidator.assert_response_time_under(response, 8.0)
