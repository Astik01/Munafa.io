import { describe, it, expect } from 'vitest';
import { buildComparisonSeries } from './CompareModal';

describe('buildComparisonSeries', () => {
  it('normalizes each series to % change from its own first valid close', () => {
    const results = [
      {
        symbol: 'RELIANCE',
        data: [
          { timestamp: 't1', close: 100 },
          { timestamp: 't2', close: 110 },
          { timestamp: 't3', close: 90 },
        ],
      },
    ];

    const merged = buildComparisonSeries(results);

    expect(merged).toEqual([
      { timestamp: 't1', RELIANCE: 0 },
      { timestamp: 't2', RELIANCE: 10 },
      { timestamp: 't3', RELIANCE: -10 },
    ]);
  });

  it('filters out non-positive close entries before normalizing', () => {
    const results = [
      {
        symbol: 'TCS',
        data: [
          { timestamp: 't1', close: 0 },
          { timestamp: 't2', close: 50 },
          { timestamp: 't3', close: -5 },
          { timestamp: 't4', close: 75 },
        ],
      },
    ];

    const merged = buildComparisonSeries(results);

    // t1 and t3 dropped; t2 becomes the new baseline (0%)
    expect(merged).toEqual([
      { timestamp: 't2', TCS: 0 },
      { timestamp: 't4', TCS: 50 },
    ]);
  });

  it('merges multiple symbols into one row per timestamp, keyed by symbol', () => {
    const results = [
      {
        symbol: 'A',
        data: [
          { timestamp: 't1', close: 100 },
          { timestamp: 't2', close: 200 },
        ],
      },
      {
        symbol: 'B',
        data: [
          { timestamp: 't1', close: 10 },
          { timestamp: 't2', close: 8 },
        ],
      },
    ];

    const merged = buildComparisonSeries(results);

    expect(merged).toEqual([
      { timestamp: 't1', A: 0, B: 0 },
      { timestamp: 't2', A: 100, B: -20 },
    ]);
  });

  it('leaves a symbol missing at a given timestamp undefined rather than 0 (union of timestamps)', () => {
    const results = [
      {
        symbol: 'A',
        data: [
          { timestamp: 't1', close: 100 },
          { timestamp: 't2', close: 110 },
        ],
      },
      {
        symbol: 'B',
        data: [{ timestamp: 't1', close: 10 }], // no t2 for B
      },
    ];

    const merged = buildComparisonSeries(results);

    const t2Row = merged.find((r) => r.timestamp === 't2');
    expect(t2Row.A).toBe(10);
    expect(t2Row.B).toBeUndefined();
  });

  it('sorts the merged rows chronologically regardless of input order', () => {
    const results = [
      {
        symbol: 'A',
        data: [
          { timestamp: '2024-03-01T00:00:00.000Z', close: 100 },
          { timestamp: '2024-01-01T00:00:00.000Z', close: 50 },
          { timestamp: '2024-02-01T00:00:00.000Z', close: 75 },
        ],
      },
    ];

    const merged = buildComparisonSeries(results);

    expect(merged.map((r) => r.timestamp)).toEqual([
      '2024-01-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-03-01T00:00:00.000Z',
    ]);
  });

  it('returns an empty array when given no series', () => {
    expect(buildComparisonSeries([])).toEqual([]);
  });

  it('returns an empty array for a symbol with no positive-close data points', () => {
    const results = [{ symbol: 'DEAD', data: [{ timestamp: 't1', close: 0 }] }];
    expect(buildComparisonSeries(results)).toEqual([]);
  });
});
