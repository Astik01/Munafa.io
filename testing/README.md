# Munafa.io testing/

A Python test harness for Munafa's frontend, added on top of the existing
React/Vite app without changing any of its code. It exists because Munafa's
only real network dependency -- a same-origin proxy to the Yahoo Finance
unofficial API -- had no automated coverage of its own, separate from the
Vitest suite that tests UI logic.

## Why this is scoped the way it is

Munafa has **no backend of its own**: no Express server, no database, no
auth. The frontend calls Yahoo Finance directly from the browser through a
rewrite (`vercel.json` in production, `vite.config.js` in dev) purely to
dodge CORS. Watchlist state is `localStorage`, not a server resource. So
"API testing" here means contract- and resilience-testing that one real
proxied endpoint, not simulating a backend that doesn't exist.

## Layout

```
testing/
  config.py            env-driven settings (base URL, timeout, Anthropic key)
  conftest.py           pytest fixtures + the TestReporter hook wiring
  pytest.ini
  spec/endpoints.json   OpenAPI-style description of the real endpoint
  utils/
    api_client.py        APIClient -- talks to Munafa's proxy
    test_data_generator.py TestDataGenerator -- valid/invalid/edge payloads
    validators.py         ResponseValidator -- status/shape/timing assertions
    reporter.py           TestReporter -- aggregates results into JSON
  ai/
    client.py             Anthropic API wrapper
    generate_test_plan.py  spec -> AI-generated test PLAN (JSON, schema-checked)
    generate_tests.py      plan -> pytest file (templated, not AI-written code)
  unit/          tests of the framework's own utilities (no network)
  integration/   multi-step flows against the live proxy
  api/           single-endpoint contract tests against the live proxy
  regression/    tests pinned to specific bugs found along the way
  generated/
    pending/       AI-generated tests land here -- NOT run by pytest
    approved/      human-approved copies of generated tests -- these run
  reports/       JSON output (gitignored)
```

## Running it

```bash
cd testing
pip install -r requirements.txt
cp .env.example .env   # set MUNAFA_BASE_URL if not testing prod, and ANTHROPIC_API_KEY for ai/
pytest                  # unit + integration + api + regression + generated/approved
pytest unit             # just the offline tests (no network, deterministic)
pytest -m security      # just the injection/edge-case security tests
```

## The AI test-case generator, and why it's split in two

`generate_test_plan.py` sends `spec/endpoints.json` to Claude and asks for a
structured JSON test **plan** (inputs + expected outcomes) -- never Python
code. `generate_tests.py` then compiles that plan into an actual pytest file
through fixed templating (`schema.py` field -> `ResponseValidator` call).

The LLM decides *what* to test -- boundary values, injection payloads, error
cases -- which is genuinely hard to enumerate by hand. It never writes
executable code directly. That means the generated `.py` file is auditable
(every line traces back to a schema field) and a malformed or hallucinated
plan fails schema validation before any code is even rendered, instead of
failing as a stack trace deep inside a generated test.

```bash
python ai/generate_test_plan.py     # spec/endpoints.json -> generated/pending/test_plan.json
python ai/generate_tests.py         # plan -> generated/pending/test_ai_generated.py
```

### Human review gate

Generated tests always land in `generated/pending/`, which `pytest.ini`
explicitly excludes from `testpaths`. Nothing there runs as part of the real
suite, and nothing is silently merged. To promote a reviewed file:

```bash
cp generated/pending/test_ai_generated.py generated/approved/
pytest generated/approved/test_ai_generated.py -v   # confirm it behaves as expected
```

## Known production finding

While validating this suite, it caught a real issue: the `/api/yahoo/*`
proxy is rate-limited by the hosting edge network independently of Yahoo's
own limits -- a burst of as few as 4-5 requests in a couple of seconds
returns `429 Edge: Too Many Requests` (plain text, not JSON), and the
frontend's `fetchYahooChart()` has no special handling for it. See
`api/test_yahoo_chart_endpoint.py`.
