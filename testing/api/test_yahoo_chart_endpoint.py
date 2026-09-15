"""Contract tests against the live /api/yahoo/* proxy -- Munafa's one real
network dependency (see testing/utils/api_client.py for why). These hit a
real deployment over the network, so they're slower and less deterministic
than unit/ -- that's expected for this layer, and is exactly why timeouts and
retries (added in a later step) matter here.
"""
import pytest

from utils.test_data_generator import TestDataGenerator
from utils.validators import ResponseValidator

pytestmark = pytest.mark.timeout(20)


def _endpoint(symbol: str) -> str:
    return f"/api/yahoo/v8/finance/chart/{symbol}"


@pytest.mark.parametrize("symbol", TestDataGenerator.valid_symbols())
def test_valid_symbol_returns_chart_data(api_client, endpoint_recorder, symbol):
    endpoint_recorder(_endpoint(symbol))
    response = api_client.get_yahoo_chart(symbol, interval="1d", range_="5d")

    ResponseValidator.assert_status_code(response, 200)
    data = ResponseValidator.assert_is_json(response)
    ResponseValidator.assert_valid_chart_response(data)

    meta = data["chart"]["result"][0]["meta"]
    assert meta["symbol"] == symbol


def test_invalid_symbol_does_not_500(api_client, endpoint_recorder):
    symbol = TestDataGenerator.invalid_symbol()
    endpoint_recorder(_endpoint(symbol))
    response = api_client.get_yahoo_chart(symbol)

    ResponseValidator.assert_no_server_error(response)
    data = ResponseValidator.assert_is_json(response)
    ResponseValidator.assert_valid_chart_response(data)


def test_empty_symbol_does_not_500(api_client, endpoint_recorder):
    endpoint_recorder(_endpoint(""))
    response = api_client.get_yahoo_chart(TestDataGenerator.empty_symbol())
    ResponseValidator.assert_no_server_error(response)


def test_excessively_long_symbol_does_not_500(api_client, endpoint_recorder):
    symbol = TestDataGenerator.excessively_long_symbol()
    endpoint_recorder(_endpoint("A" * 20 + "..."))
    response = api_client.get_yahoo_chart(symbol)
    ResponseValidator.assert_no_server_error(response)


@pytest.mark.parametrize("params", TestDataGenerator.missing_params_cases())
def test_missing_query_params_degrade_gracefully(api_client, endpoint_recorder, params):
    endpoint_recorder(_endpoint(TestDataGenerator.valid_symbol()))
    response = api_client.get_raw(_endpoint(TestDataGenerator.valid_symbol()), params=params)
    ResponseValidator.assert_no_server_error(response)


@pytest.mark.parametrize("params", TestDataGenerator.malformed_param_cases())
def test_malformed_query_params_do_not_500(api_client, endpoint_recorder, params):
    endpoint_recorder(_endpoint(TestDataGenerator.valid_symbol()))
    response = api_client.get_raw(_endpoint(TestDataGenerator.valid_symbol()), params=params)
    ResponseValidator.assert_no_server_error(response)


@pytest.mark.security
@pytest.mark.parametrize("payload", TestDataGenerator.injection_payloads())
def test_injection_style_symbols_are_handled_safely(api_client, endpoint_recorder, payload):
    """Not an expectation that Yahoo's API is vulnerable -- it's a guardrail
    that the proxy path never turns a malicious symbol into a 5xx, and never
    echoes the raw payload back unescaped (a cheap reflected-XSS smoke test)."""
    endpoint_recorder(_endpoint("<injection payload>"))
    response = api_client.get_raw(_endpoint(payload))

    ResponseValidator.assert_no_server_error(response)
    assert "<script>" not in response.text


def test_response_time_is_reasonable_for_a_single_symbol(api_client, endpoint_recorder):
    symbol = TestDataGenerator.valid_symbol()
    endpoint_recorder(_endpoint(symbol))
    response = api_client.get_yahoo_chart(symbol)
    ResponseValidator.assert_response_time_under(response, 8.0)
