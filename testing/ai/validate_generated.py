"""Sanity-checks a generated test file before it's trusted to run.

generate_tests.py already refuses to write a file that doesn't compile (see
its `compile(...)` call), so a syntax error should never reach disk. This is
the defense-in-depth layer for what compile() can't catch: someone hand-edits
a file in generated/pending/ before approving it, or a future change to
generate_tests.py's templating produces syntactically valid but suspicious
code. It's deliberately conservative -- a static scan for a short list of
calls that have no business in an HTTP test file, not a sandboxing solution.

Usage:
    python ai/validate_generated.py generated/pending/test_ai_generated.py
    python ai/validate_generated.py generated/pending/*.py generated/approved/*.py
"""
from __future__ import annotations

import ast
import sys

# Names that suggest the file is doing something other than making HTTP
# requests and asserting on the result -- not exhaustive, just the obvious ones.
DISALLOWED_CALLS = {
    "eval", "exec", "compile", "__import__",
    "system", "popen", "spawn", "fork",
}
DISALLOWED_MODULES = {"os", "subprocess", "shutil", "socket", "ctypes", "pickle"}


def check_file(path: str) -> list[str]:
    """Returns a list of human-readable problems; empty means the file passed."""
    with open(path, encoding="utf-8") as f:
        source = f.read()

    problems: list[str] = []

    try:
        tree = ast.parse(source, filename=path)
    except SyntaxError as exc:
        return [f"{path}:{exc.lineno}: syntax error: {exc.msg}"]

    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = [n.name for n in node.names] if isinstance(node, ast.Import) else [node.module or ""]
            for name in names:
                top_level = name.split(".")[0]
                if top_level in DISALLOWED_MODULES:
                    problems.append(f"{path}:{node.lineno}: disallowed import '{name}'")
        elif isinstance(node, ast.Call):
            func = node.func
            func_name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", None)
            if func_name in DISALLOWED_CALLS:
                problems.append(f"{path}:{node.lineno}: disallowed call '{func_name}(...)'")

    return problems


def main(argv: list[str]) -> int:
    if not argv:
        print("usage: python ai/validate_generated.py <file.py> [file.py ...]", file=sys.stderr)
        return 2

    all_problems: list[str] = []
    for path in argv:
        all_problems.extend(check_file(path))

    if all_problems:
        print(f"[validate_generated] {len(all_problems)} problem(s) found:")
        for problem in all_problems:
            print(f"  - {problem}")
        return 1

    print(f"[validate_generated] {len(argv)} file(s) OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
