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
    html_report.py         renders TestReporter's data as a self-contained HTML page
  ai/
    client.py             Anthropic API wrapper
    generate_test_plan.py  spec -> AI-generated test PLAN (JSON, schema-checked)
    generate_tests.py      plan -> pytest file (templated, not AI-written code)
    analyze_failures.py    pytest report -> plain-English failure analysis
  unit/          tests of the framework's own utilities (no network)
  integration/   multi-step flows against the live proxy
  api/           single-endpoint contract tests for the proxy -- mostly
                 mocked (api_client.session.get), plus a couple of
                 @pytest.mark.live smoke tests against the real deployment
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
pytest -m live          # the few tests that hit the real deployment (see "Live vs. mocked" below)
```

### Live vs. mocked, and why

`api/test_yahoo_chart_endpoint.py` used to make every one of its requests --
missing/malformed params, injection payloads, invalid symbols, all of it --
against the real endpoint. That's a lot of requests testing this repo's own
handling of an *input*, not Yahoo's actual data, and running them all in a
burst reliably tripped the rate limit described below (18 of 60 tests
failing with `RetryExhausted` 429s was a real, reproduced run, not a
hypothetical). Those cases are now mocked via
`api_client.session.get` -- they test how `api_client`/`ResponseValidator`
handle the response shapes Yahoo is documented to return for bad input
(`spec/endpoints.json`'s `200_or_404_error` case), not Yahoo's live data,
so they don't need the network at all.

A couple of `@pytest.mark.live` tests are kept, hitting one real symbol
(`RELIANCE.NS`) each with a `time.sleep(1)` between them, to prove the real
end-to-end path still works. `pytest.ini`'s `addopts = -m "not live"`
excludes them from every default `pytest` run (and therefore from CI's
blocking gate) -- run them explicitly with `pytest -m live`, on demand,
the same way the Vitest suite's live Yahoo test is run with
`npm run test:integration` instead of `npm test`.

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

## Failure analysis

`pytest --ai-analyze` sends the structured failure list from
`reports/latest.json` to Claude after a run and prints a short root-cause
summary (grouped by pattern, not one line per test) alongside the normal
pytest output -- what failed, a likely category (auth/validation/rate-limit/
upstream-data/network/test-bug), and a concrete next step. It's opt-in: a
plain `pytest` never calls the API or needs a key, and if the key is missing
or the call fails, analysis is skipped with a one-line notice rather than
breaking an otherwise-valid test run.

```bash
pytest --ai-analyze   # same run, plus a summary if anything failed
python ai/analyze_failures.py --report reports/latest.json   # standalone
```

## Reliability

`utils/retry.py` wraps `APIClient.get_raw` with retry-with-backoff: a
`ConnectionError`/`Timeout`, or a 429/502/503/504 response, is retried up to
`MUNAFA_MAX_RETRIES` times (exponential backoff, `MUNAFA_RETRY_BASE_DELAY`
base) before raising `RetryExhausted` -- a clear failure, never a hang, and
never a silently-swallowed error. This exists specifically because of the
rate-limiting finding below: without it, `api/` tests running in a burst are
flaky for a reason unrelated to what they're actually testing.

`ai/validate_generated.py` is a defense-in-depth static check for generated
test files: `ast.parse` (syntax) plus a scan for calls/imports (`eval`,
`os.system`, `subprocess`, ...) that have no business in an HTTP test.
`generate_tests.py` already refuses to write a file that doesn't compile, so
this mainly guards against a hand-edited file in `generated/pending/` before
it's approved.

```bash
python ai/validate_generated.py generated/pending/test_ai_generated.py
```

## Reports

Every run writes both `reports/latest.json` (machine-readable: total/passed/
failed/skipped, pass rate, and the full per-test list with endpoint + reason
for each failure) and `reports/latest.html` (the same data as a single
self-contained page -- no build step, no external assets, safe to hand
someone or attach to a CI run as-is). Both are gitignored; they're a run
artifact, not source.

## CI

`.github/workflows/ci.yml` runs this suite in a `python-api-testing` job
alongside (not instead of) the existing frontend Vitest job:

1. `pytest unit` -- offline, deterministic, **gates the build**.
2. `pytest api` -- mocked (see "Live vs. mocked" above), so this is also
   deterministic and needs no server or network. **Gates the build**
   alongside unit tests.
3. `pytest integration generated/approved --ai-analyze` --
   non-blocking (`continue-on-error: true`): both folders may exercise a
   live proxy (`integration/` by name; an approved AI-generated test could,
   per `generate_tests.py`), so a failure here can mean the code regressed
   or that Yahoo's having a bad day, and a third-party dependency's
   flakiness shouldn't block merges the way a real regression should. Both
   folders are normally empty, which pytest treats as exit code 5 -- the
   step tolerates that so an empty folder shows green. `ANTHROPIC_API_KEY`
   comes from a repo secret if set; the step degrades gracefully if it
   isn't (see Failure analysis above).
4. Uploads `reports/latest.{json,html}` as a workflow artifact either way.

`@pytest.mark.live` tests are **not** run in CI at all -- `pytest.ini`'s
`addopts` excludes them from every default invocation above, on purpose
(see "Live vs. mocked"). There's no local dev server to proxy through
anymore either, since nothing in this job talks to Yahoo by default now.

Deliberately not run in CI: `ai/generate_test_plan.py` and
`generate_tests.py`. Generating tests calls a paid API and produces files
meant for human review (see the review gate above) -- doing that on every
push would both cost money on every commit and quietly bypass the gate. CI
only *runs* whatever's already been reviewed into `generated/approved/`.

## Known production finding

While validating this suite, it caught a real issue: the `/api/yahoo/*`
proxy is rate-limited by the hosting edge network independently of Yahoo's
own limits -- a burst of as few as 4-5 requests in a couple of seconds
returns `429 Edge: Too Many Requests` (plain text, not JSON), and the
frontend's `fetchYahooChart()` has no special handling for it. See
`api/test_yahoo_chart_endpoint.py`. It's also why that file mocks most of
its own tests rather than hitting the real endpoint on every run (see
"Live vs. mocked" above), and why `integration`/`generated/approved` and
`@pytest.mark.live` stay out of the blocking CI gate.
