"""Unit tests for TestDataGenerator -- checks the fixtures it hands out are
actually shaped the way every other test file assumes (e.g. that the
"missing param" cases really are missing a required key)."""
from utils.test_data_generator import TestDataGenerator


def test_valid_symbol_is_nse_suffixed():
    assert TestDataGenerator.valid_symbol().endswith(".NS")


def test_valid_symbols_are_all_nse_suffixed():
    symbols = TestDataGenerator.valid_symbols()
    assert len(symbols) > 0
    assert all(s.endswith(".NS") for s in symbols)


def test_invalid_symbol_differs_from_valid_ones():
    assert TestDataGenerator.invalid_symbol() not in TestDataGenerator.valid_symbols()


def test_empty_and_null_symbol_are_distinct_edge_cases():
    assert TestDataGenerator.empty_symbol() == ""
    assert TestDataGenerator.null_symbol() is None


def test_excessively_long_symbol_respects_requested_length():
    assert len(TestDataGenerator.excessively_long_symbol(123)) == 123


def test_missing_params_cases_each_drop_a_required_key():
    for case in TestDataGenerator.missing_params_cases():
        assert not ({"interval", "range"} <= case.keys())


def test_malformed_param_cases_are_nonempty():
    assert len(TestDataGenerator.malformed_param_cases()) > 0


def test_injection_payloads_cover_common_attack_classes():
    payloads = " ".join(TestDataGenerator.injection_payloads())
    assert "DROP TABLE" in payloads  # SQLi-style
    assert "<script>" in payloads  # XSS-style
    assert ".." in payloads  # path traversal
