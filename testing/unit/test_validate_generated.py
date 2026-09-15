"""Unit tests for ai/validate_generated.py's static checks."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ai.validate_generated import check_file


def write(tmp_path, name: str, source: str) -> str:
    path = os.path.join(tmp_path, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(source)
    return path


def test_clean_file_has_no_problems(tmp_path):
    path = write(tmp_path, "ok.py", "def test_thing():\n    assert 1 == 1\n")
    assert check_file(path) == []


def test_syntax_error_is_reported(tmp_path):
    path = write(tmp_path, "broken.py", "def test_thing(:\n    pass\n")
    problems = check_file(path)
    assert len(problems) == 1
    assert "syntax error" in problems[0]


def test_disallowed_import_is_flagged(tmp_path):
    path = write(tmp_path, "bad_import.py", "import os\n\ndef test_thing():\n    pass\n")
    problems = check_file(path)
    assert any("disallowed import 'os'" in p for p in problems)


def test_disallowed_call_is_flagged(tmp_path):
    path = write(tmp_path, "bad_call.py", "def test_thing():\n    eval('1+1')\n")
    problems = check_file(path)
    assert any("disallowed call 'eval" in p for p in problems)
