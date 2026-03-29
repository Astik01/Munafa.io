// stockService.js — Yahoo Finance (no API key, no limits)

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const cache = {};

// Yahoo Finance proxy (avoids CORS issues in browser)
const YF_BASE = 'https://query1.finance.yahoo.com';

export const STOCKS = [
  { symbol: 'RELIANCE',   name: 'Reliance Industries',       sector: 'Energy',   color: '#FF9800' },
  { symbol: 'TCS',        name: 'Tata Consultancy Services', sector: 'IT',       color: '#2196F3' },
  { symbol: 'INFY',       name: 'Infosys',                   sector: 'IT',       color: '#2196F3' },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank',                 sector: 'Banking',  color: '#9C27B0' },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank',                sector: 'Banking',  color: '#9C27B0' },
  { symbol: 'WIPRO',      name: 'Wipro',                     sector: 'IT',       color: '#2196F3' },
  { symbol: 'ADANIENT',   name: 'Adani Enterprises',         sector: 'Infra',    color: '#795548' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance',             sector: 'Finance',  color: '#673AB7' },
  { symbol: 'SBIN',       name: 'State Bank of India',       sector: 'Banking',  color: '#9C27B0' },
  { symbol: 'MARUTI',     name: 'Maruti Suzuki',             sector: 'Auto',     color: '#F44336' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors',               sector: 'Auto',     color: '#F44336' },
  { symbol: 'SUNPHARMA',  name: 'Sun Pharmaceutical',        sector: 'Pharma',   color: '#009688' },
  { symbol: 'LTIM',       name: 'LTIMindtree',               sector: 'IT',       color: '#2196F3' },
  { symbol: 'AXISBANK',   name: 'Axis Bank',                 sector: 'Banking',  color: '#9C27B0' },
  { symbol: 'KOTAKBANK',  name: 'Kotak Mahindra Bank',       sector: 'Banking',  color: '#9C27B0' },
  { symbol: 'TITAN',      name: 'Titan Company',             sector: 'Consumer', color: '#E91E63' },
  { symbol: 'NESTLEIND',  name: 'Nestle India',              sector: 'Consumer', color: '#E91E63' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement',          sector: 'Infra',    color: '#795548' },
  { symbol: 'POWERGRID',  name: 'Power Grid Corporation',    sector: 'Energy',   color: '#FF9800' },
  { symbol: 'NTPC',       name: 'NTPC Limited',              sector: 'Energy',   color: '#FF9800' },
];

// ─── Cache helpers ───────────────────────────────────────────────────────────

function getCached(key) {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    delete cache[key];
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ─── Yahoo Finance symbol format ─────────────────────────────────────────────
// NSE stocks use .NS suffix e.g. TCS.NS, RELIANCE.NS
// Nifty 50 index = ^NSEI

function toYFSymbol(symbol) {
  return `${symbol}.NS`;
}

// ─── Range → Yahoo Finance params ────────────────────────────────────────────

function buildChartParams(range) {
  switch (range) {
    case '1D': return { interval: '5m',  range: '1d'  };
    case '1W': return { interval: '1h',  range: '5d'  };
    case '1M': return { interval: '1d',  range: '1mo' };
    case '3M': return { interval: '1d',  range: '3mo' };
    case '1Y': return { interval: '1wk', range: '1y'  };
    default:   return { interval: '1d',  range: '1mo' };
  }
}

// ─── Fetch single stock quote ─────────────────────────────────────────────────

async function fetchQuote(yfSymbol) {
  const url = `${YF_BASE}/v8/finance/chart/${yfSymbol}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${yfSymbol}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${yfSymbol}`);
  return result;
}

function parseQuote(result, meta) {
  const q = result.meta;
  const indicators = result.indicators?.quote?.[0] || {};
  const closes = indicators.close || [];
  const opens  = indicators.open  || [];
  const highs  = indicators.high  || [];
  const lows   = indicators.low   || [];
  const vols   = indicators.volume || [];

  const price         = toNumber(q.regularMarketPrice);
  const previousClose = toNumber(q.chartPreviousClose ?? q.previousClose);
  const change        = price - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  // Last valid values from series
  const lastClose  = closes.filter(Boolean).at(-1) ?? price;
  const lastOpen   = opens.filter(Boolean).at(-1)  ?? 0;
  const lastHigh   = highs.filter(Boolean).at(-1)  ?? 0;
  const lastLow    = lows.filter(Boolean).at(-1)   ?? 0;
  const lastVolume = vols.filter(Boolean).at(-1)   ?? 0;

  return {
    id:               meta.symbol,
    symbol:           meta.symbol,
    name:             meta.name,
    sector:           meta.sector,
    color:            meta.color,
    price,
    change:           toNumber(change),
    changePercent:    toNumber(changePercent),
    open:             toNumber(q.regularMarketOpen  ?? lastOpen),
    high:             toNumber(q.regularMarketDayHigh ?? lastHigh),
    low:              toNumber(q.regularMarketDayLow  ?? lastLow),
    previousClose,
    volume:           toNumber(q.regularMarketVolume  ?? lastVolume),
    fiftyTwoWeekHigh: toNumber(q.fiftyTwoWeekHigh),
    fiftyTwoWeekLow:  toNumber(q.fiftyTwoWeekLow),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchAllStocks() {
  const cacheKey = 'allStocks';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Fetch all stocks in parallel
    const results = await Promise.allSettled(
      STOCKS.map(async (meta) => {
        const yfSymbol = toYFSymbol(meta.symbol);
        const result = await fetchQuote(yfSymbol);
        return parseQuote(result, meta);
      })
    );

    const stocks = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`Failed to fetch ${STOCKS[i].symbol}:`, r.reason);
      // Return empty stock so UI doesn't break
      return {
        id: STOCKS[i].symbol,
        symbol: STOCKS[i].symbol,
        name: STOCKS[i].name,
        sector: STOCKS[i].sector,
        color: STOCKS[i].color,
        price: 0, change: 0, changePercent: 0,
        open: 0, high: 0, low: 0,
        previousClose: 0, volume: 0,
        fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0,
      };
    });

    setCache(cacheKey, stocks);
    return stocks;
  } catch (err) {
    console.error('fetchAllStocks error:', err);
    return [];
  }
}

export async function fetchStockChart(symbol, range) {
  const cacheKey = `chart:${symbol}:${range}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { interval, range: yfRange } = buildChartParams(range);
    const yfSymbol = toYFSymbol(symbol);
    const url = `${YF_BASE}/v8/finance/chart/${yfSymbol}?interval=${interval}&range=${yfRange}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No chart data');

    const timestamps = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};

    const chartData = timestamps.map((ts, i) => ({
      timestamp: new Date(ts * 1000).toISOString(),
      open:   toNumber(q.open?.[i]),
      high:   toNumber(q.high?.[i]),
      low:    toNumber(q.low?.[i]),
      close:  toNumber(q.close?.[i]),
      volume: toNumber(q.volume?.[i]),
    })).filter(d => d.close > 0); // remove empty candles

    setCache(cacheKey, chartData);
    return chartData;
  } catch (err) {
    console.error('fetchStockChart error:', err);
    return [];
  }
}

export async function fetchNifty() {
  const cacheKey = 'nifty';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${YF_BASE}/v8/finance/chart/%5ENSETP?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price         = toNumber(meta.regularMarketPrice);
    const previousClose = toNumber(meta.chartPreviousClose ?? meta.previousClose);
    const change        = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    const result = { price, change, changePercent };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('fetchNifty error:', err);
    return null;
  }
}