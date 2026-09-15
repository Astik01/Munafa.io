// Integration test against the REAL Yahoo Finance API -- no mocked fetch.
// stockService.js normally reaches this through the /api/yahoo rewrite
// (vite.config.js / vercel.json), which only exists when a dev server or
// the Vercel deployment is running; a plain `vitest run` has neither, so
// this hits the upstream directly to exercise the actual response contract
// stockService.js parses.
import { describe, it, expect } from 'vitest';

describe('Yahoo Finance API (live integration)', () => {
  it('returns real chart data for RELIANCE.NS in the shape stockService.js expects', async () => {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?interval=1d&range=5d',
      { headers: { Accept: 'application/json' } }
    );

    if (res.status === 429) {
      // Yahoo's unofficial API rate-limits aggressively and without
      // documentation (see testing/README.md's known_issues) -- treat that
      // as this dependency having a bad day, not a failed assertion about
      // our own code.
      console.warn('[integration] Yahoo Finance returned 429 -- skipping assertions for this run');
      return;
    }

    expect(res.ok).toBe(true);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    expect(result).toBeTruthy();
    expect(result.meta.symbol).toBe('RELIANCE.NS');
    expect(typeof result.meta.regularMarketPrice).toBe('number');
    expect(Array.isArray(result.timestamp)).toBe(true);
    expect(result.timestamp.length).toBeGreaterThan(0);
  }, 15000);
});
