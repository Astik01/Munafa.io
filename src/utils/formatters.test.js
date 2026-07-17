import { describe, it, expect } from 'vitest';
import { formatINR, formatChange, formatVolume, formatMarketCap, formatDate } from './formatters';

describe('formatINR', () => {
  it('returns ₹0.00 for null/undefined/NaN', () => {
    expect(formatINR(null)).toBe('₹0.00');
    expect(formatINR(undefined)).toBe('₹0.00');
    expect(formatINR('abc')).toBe('₹0.00');
  });

  it('formats a whole number with two decimal places', () => {
    expect(formatINR(500)).toMatch(/₹\s?500\.00/);
  });

  it('formats with Indian digit grouping (lakh/crore commas)', () => {
    expect(formatINR(1234.5)).toMatch(/₹\s?1,234\.50/);
  });

  it('formats large values with correct Indian comma placement', () => {
    expect(formatINR(1234567)).toMatch(/₹\s?12,34,567\.00/);
  });
});

describe('formatChange', () => {
  it('returns 0.00% for null/undefined/NaN', () => {
    expect(formatChange(null)).toBe('0.00%');
    expect(formatChange(undefined)).toBe('0.00%');
    expect(formatChange('abc')).toBe('0.00%');
  });

  it('prefixes positive values with +', () => {
    expect(formatChange(5.2)).toBe('+5.20%');
  });

  it('prefixes negative values with -', () => {
    expect(formatChange(-3.456)).toBe('-3.46%');
  });

  it('has no sign for exactly zero', () => {
    expect(formatChange(0)).toBe('0.00%');
  });
});

describe('formatVolume', () => {
  it('returns - for null/undefined/NaN', () => {
    expect(formatVolume(null)).toBe('-');
    expect(formatVolume(undefined)).toBe('-');
  });

  it('returns raw number below 1000', () => {
    expect(formatVolume(500)).toBe('500');
  });

  it('formats thousands with K suffix', () => {
    expect(formatVolume(5000)).toBe('5.0K');
  });

  it('formats lakhs with L suffix', () => {
    expect(formatVolume(300000)).toBe('3.0L');
  });

  it('formats crores with Cr suffix', () => {
    expect(formatVolume(20000000)).toBe('2.0Cr');
  });

  it('handles negative volume correctly', () => {
    expect(formatVolume(-1500)).toBe('-1.5K');
  });
});

describe('formatMarketCap', () => {
  it('returns - for null/undefined/NaN', () => {
    expect(formatMarketCap(null)).toBe('-');
  });

  it('formats values >= 1 crore as ₹X.XL Cr', () => {
    expect(formatMarketCap(50000000)).toBe('₹5.0L Cr');
  });

  it('falls back to formatINR for values below 1 crore', () => {
    expect(formatMarketCap(500)).toMatch(/₹\s?500\.00/);
  });
});

describe('formatDate', () => {
  it('returns empty string for falsy timestamp', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate(0)).toBe('');
  });

  it('returns a time string (h:mm am/pm) for a timestamp from today', () => {
    const now = new Date();
    expect(formatDate(now.toISOString())).toMatch(/^\d{1,2}:\d{2}\s?[ap]m$/i);
  });

  it('returns a "D Mon" style date for a timestamp not from today', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    expect(formatDate(pastDate.toISOString())).toMatch(/^\d{1,2}\s[A-Za-z]{3}$/);
  });
});