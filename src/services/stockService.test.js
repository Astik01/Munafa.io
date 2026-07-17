import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildChartParams,
  fetchStocksChunk,
  fetchStockChart,
  STOCKS,
} from './stockService';

function mockYahooChartResponse({ price = 100, prevClose = 95, timestamps = [], quote = {} } = {}) {
  return {
    ok: true,
    json: async () => ({
      chart: {
        result: [
          {
            meta: {
              symbol: 'TEST.NS',
              regularMarketPrice: price,
              chartPreviousClose: prevClose,
              regularMarketOpen: price - 1,
              regularMarketDayHigh: price + 2,
              regularMarketDayLow: price - 2,
              regularMarketVolume: 123456,
              fiftyTwoWeekHigh: price + 20,
              fiftyTwoWeekLow: price - 20,
            },
            timestamp: timestamps,
            indicators: {
              quote: [quote],
            },
          },
        ],
      },
    }),
  };
}

describe('buildChartParams', () => {
  it('maps known ranges to correct interval/range pairs', () => {
    expect(buildChartParams('1D')).toEqual({ interval: '5m', range: '1d' });
    expect(buildChartParams('1M')).toEqual({ interval: '1d', range: '1mo' });
    expect(buildChartParams('1Y')).toEqual({ interval: '1wk', range: '1y' });
  });

  it('falls back to 1M params for an unknown range', () => {
    expect(buildChartParams('BOGUS')).toEqual({ interval: '1d', range: '1mo' });
  });
});

describe('fetchStocksChunk', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses a quote with correct change/changePercent calculation', async () => {
    global.fetch.mockResolvedValue(mockYahooChartResponse({ price: 110, prevClose: 100 }));

    const [quote] = await fetchStocksChunk(['RELIANCE']);

    expect(quote.symbol).toBe('RELIANCE');
    expect(quote.price).toBe(110);
    expect(quote.change).toBe(10);
    expect(quote.changePercent).toBeCloseTo(10, 5);
  });

  it('uses metadata from STOCKS list when symbol is known', async () => {
    global.fetch.mockResolvedValue(mockYahooChartResponse());
    const [quote] = await fetchStocksChunk(['TCS']);
    const meta = STOCKS.find((s) => s.symbol === 'TCS');

    expect(quote.name).toBe(meta.name);
    expect(quote.sector).toBe(meta.sector);
  });

  it('falls back to symbol-as-name for unknown tickers', async () => {
    global.fetch.mockResolvedValue(mockYahooChartResponse());
    const [quote] = await fetchStocksChunk(['UNKNOWNSYM']);

    expect(quote.symbol).toBe('UNKNOWNSYM');
    expect(quote.name).toBe('UNKNOWNSYM');
  });

  it('silently drops symbols whose fetch fails, returning only successes', async () => {
    global.fetch
      .mockResolvedValueOnce(mockYahooChartResponse({ price: 200, prevClose: 190 }))
      .mockRejectedValueOnce(new Error('network error'));

    const results = await fetchStocksChunk(['RELIANCE', 'TCS']);
    expect(results).toHaveLength(1);
    expect(results[0].price).toBe(200);
  });
});

describe('fetchStockChart', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps timestamps to ISO chart rows and filters out zero-close entries', async () => {
    const timestamps = [1700000000, 1700086400, 1700172800];
    const quote = {
      open: [10, 11, 0],
      high: [12, 13, 0],
      low: [9, 10, 0],
      close: [11, 12, 0], // last entry has close 0 → should be filtered out
      volume: [1000, 1500, 0],
    };
    global.fetch.mockResolvedValue(mockYahooChartResponse({ timestamps, quote }));

    const result = await fetchStockChart('RELIANCE', '1M');

    expect(result).toHaveLength(2); // third entry (close: 0) dropped
    expect(result[0].close).toBe(11);
    expect(result[1].close).toBe(12);
    expect(result[0].timestamp).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it('returns an empty array (not a throw) when the fetch fails', async () => {
    global.fetch.mockRejectedValue(new Error('network down'));
    // Use a distinct symbol/range from the previous test to avoid hitting
    // stockService's internal 30s cache, which is shared across tests in this file
    const result = await fetchStockChart('NOCACHE_TEST_SYMBOL', '3M');
    expect(result).toEqual([]);
  });
}); 