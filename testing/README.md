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
  config.py            env-driven settings (base URL, timeout)
  conftest.py           pytest fixtures + the TestReporter hook wiring
  pytest.ini
  utils/
    api_client.py        APIClient -- talks to Munafa's proxy
    test_data_generator.py TestDataGenerator -- valid/invalid/edge payloads
    validators.py         ResponseValidator -- status/shape/timing assertions
    reporter.py           TestReporter -- aggregates results into JSON
  unit/          tests of the framework's own utilities (no network)
  integration/   multi-step flows against the live proxy
  api/           single-endpoint contract tests against the live proxy
  regression/    tests pinned to specific bugs found along the way
  generated/     placeholder -- AI-generated tests land here (next step)
  reports/       JSON output (gitignored)
```

## Running it

```bash
cd testing
pip install -r requirements.txt
cp .env.example .env   # set MUNAFA_BASE_URL if not testing prod
pytest                  # unit + integration + api + regression + generated
pytest unit             # just the offline tests (no network, deterministic)
pytest -m security      # just the injection/edge-case security tests
```

## Known production finding

While validating this suite, it caught a real issue: the `/api/yahoo/*`
proxy is rate-limited by the hosting edge network independently of Yahoo's
own limits -- a burst of as few as 4-5 requests in a couple of seconds
returns `429 Edge: Too Many Requests` (plain text, not JSON), and the
frontend's `fetchYahooChart()` has no special handling for it. See
`api/test_yahoo_chart_endpoint.py`.
