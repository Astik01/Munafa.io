"""Generates the payload variants used across api/, regression/, and
generated/ tests, so every test file isn't hand-rolling its own edge cases.

Named `TestDataGenerator` per the project's utility naming, but it holds no
test cases itself -- pytest would otherwise try to collect it as a test class
because of the `Test` prefix, so collection is disabled explicitly below.
"""
from __future__ import annotations


class TestDataGenerator:
    __test__ = False  # tell pytest this isn't a test class despite the name

    VALID_SYMBOLS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"]
    VALID_INTERVALS = ["1d", "1wk", "5m", "15m", "1h"]
    VALID_RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y"]

    @staticmethod
    def valid_symbol() -> str:
        return "RELIANCE.NS"

    @staticmethod
    def valid_symbols() -> list[str]:
        return list(TestDataGenerator.VALID_SYMBOLS)

    @staticmethod
    def invalid_symbol() -> str:
        """Well-formed but nonexistent ticker -- should 404 / return chart.error,
        not 500."""
        return "ZZZZNOTAREALTICKER.NS"

    @staticmethod
    def empty_symbol() -> str:
        return ""

    @staticmethod
    def null_symbol() -> None:
        return None

    @staticmethod
    def excessively_long_symbol(length: int = 5000) -> str:
        return "A" * length

    @staticmethod
    def missing_params_cases() -> list[dict]:
        """Each dict is a partial query-param set with one required field
        dropped, to check the proxy/upstream degrade instead of crashing."""
        return [
            {"range": "1mo"},          # missing interval
            {"interval": "1d"},        # missing range
            {},                         # missing both
        ]

    @staticmethod
    def malformed_param_cases() -> list[dict]:
        return [
            {"interval": "not_a_real_interval", "range": "1mo"},
            {"interval": "1d", "range": "not_a_real_range"},
            {"interval": "", "range": ""},
            {"interval": 12345, "range": True},
        ]

    @staticmethod
    def injection_payloads() -> list[str]:
        """Strings aimed at the symbol path segment: SQLi/NoSQLi-style,
        XSS-style, path traversal, and null-byte payloads. Munafa has no DB
        or template rendering on this path, so the expected outcome is
        "handled as an ordinary invalid symbol" -- these tests exist to prove
        that, not because a hit is expected."""
        return [
            "RELIANCE.NS' OR '1'='1",
            "RELIANCE.NS'; DROP TABLE stocks;--",
            "<script>alert(1)</script>",
            "../../../../etc/passwd",
            "RELIANCE.NS%00.NS",
            "{\"$ne\": null}",
            "RELIANCE.NS" + "/" * 50,
        ]

    @staticmethod
    def excessively_long_query_value(length: int = 10000) -> str:
        return "1" * length
