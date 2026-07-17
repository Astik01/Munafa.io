// stockService.js — Yahoo Finance via Vite proxy

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const cache = {};

// Vite dev proxy rewrites /api/yahoo → https://query1.finance.yahoo.com
const API_BASE = '/api/yahoo';

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

// ─── Yahoo symbol helpers ────────────────────────────────────────────────────

function toYFSymbol(symbol) {
  return `${symbol}.NS`;
}

// ─── Range → Yahoo Finance params ────────────────────────────────────────────

export function buildChartParams(range) {
  switch (range) {
    case '1D': return { interval: '5m',  range: '1d'  };
    case '5D': return { interval: '15m', range: '5d'  };
    case '1W': return { interval: '1h',  range: '5d'  };
    case '1M': return { interval: '1d',  range: '1mo' };
    case '3M': return { interval: '1d',  range: '3mo' };
    case '6M': return { interval: '1d',  range: '6mo' };
    case '1Y': return { interval: '1wk', range: '1y'  };
    default:   return { interval: '1d',  range: '1mo' };
  }
}

// ─── Fetch raw Yahoo chart result ────────────────────────────────────────────

async function fetchYahooChart(yfSymbol, interval, range) {
  const url = `${API_BASE}/v8/finance/chart/${encodeURIComponent(yfSymbol)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${yfSymbol}`);
    err.code = res.status;
    throw err;
  }
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${yfSymbol}`);
  return result;
}

// ─── Parse a quote from Yahoo chart response ─────────────────────────────────

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

// ─── Public: Fetch a chunk of stocks ─────────────────────────────────────────

export async function fetchStocksChunk(symbolList) {
  const results = await Promise.allSettled(
    symbolList.map(async (sym) => {
      const meta = STOCKS.find((s) => s.symbol === sym) || {
        symbol: sym, name: sym, sector: '', color: '#666',
      };
      const result = await fetchYahooChart(toYFSymbol(sym), '1d', '5d');
      return parseQuote(result, meta);
    })
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
}

// ─── Public: Fetch all stocks ────────────────────────────────────────────────

export async function fetchAllStocks() {
  const cacheKey = 'allStocks';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const results = await Promise.allSettled(
      STOCKS.map(async (meta) => {
        const result = await fetchYahooChart(toYFSymbol(meta.symbol), '1d', '5d');
        return parseQuote(result, meta);
      })
    );

    const stocks = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`Failed to fetch ${STOCKS[i].symbol}:`, r.reason);
      return {
        id: STOCKS[i].symbol, symbol: STOCKS[i].symbol, name: STOCKS[i].name,
        sector: STOCKS[i].sector, color: STOCKS[i].color,
        price: 0, change: 0, changePercent: 0, open: 0, high: 0, low: 0,
        previousClose: 0, volume: 0, fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0,
      };
    });

    setCache(cacheKey, stocks);
    return stocks;
  } catch (err) {
    console.error('fetchAllStocks error:', err);
    return [];
  }
}

// ─── Public: Fetch OHLC chart data ───────────────────────────────────────────

export async function fetchStockChart(symbol, range) {
  const cacheKey = `chart:${symbol}:${range}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { interval, range: yfRange } = buildChartParams(range);
    const yfSymbol = toYFSymbol(symbol);
    const result = await fetchYahooChart(yfSymbol, interval, yfRange);

    const timestamps = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};

    const chartData = timestamps.map((ts, i) => ({
      timestamp: new Date(ts * 1000).toISOString(),
      time: ts,
      open:   toNumber(q.open?.[i]),
      high:   toNumber(q.high?.[i]),
      low:    toNumber(q.low?.[i]),
      close:  toNumber(q.close?.[i]),
      volume: toNumber(q.volume?.[i]),
    })).filter(d => d.close > 0);

    setCache(cacheKey, chartData);
    return chartData;
  } catch (err) {
    console.error('fetchStockChart error:', err);
    return [];
  }
}

// ─── Public: Fetch single index quote ────────────────────────────────────────

export async function fetchIndexQuote(yahooSymbol) {
  const cacheKey = `index:${yahooSymbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const result = await fetchYahooChart(yahooSymbol, '1d', '5d');
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const price         = toNumber(meta.regularMarketPrice);
    const previousClose = toNumber(meta.chartPreviousClose ?? meta.previousClose);
    const change        = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    // Last 5 valid closing prices for sparkline
    const sparkline = closes.filter(Boolean).slice(-5);

    const data = { price, change, changePercent, sparkline };
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error(`fetchIndexQuote error (${yahooSymbol}):`, err);
    return null;
  }
}

// ─── Public: Fetch Nifty 50 ──────────────────────────────────────────────────

export async function fetchNifty() {
  return fetchIndexQuote('^NSEI');
}

// ─── Public: Fetch a batch of stock quotes by symbol ─────────────────────────

export async function fetchStocksBatch(symbols, batchSize = 10) {
  const all = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (sym) => {
        const result = await fetchYahooChart(toYFSymbol(sym), '1d', '5d');
        const q = result.meta;
        const indicators = result.indicators?.quote?.[0] || {};
        const price         = toNumber(q.regularMarketPrice);
        const previousClose = toNumber(q.chartPreviousClose ?? q.previousClose);
        const change        = price - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

        return {
          symbol: sym,
          name: sym,
          price,
          change: toNumber(change),
          changePercent: toNumber(changePercent),
          open:             toNumber(q.regularMarketOpen ?? 0),
          high:             toNumber(q.regularMarketDayHigh ?? 0),
          low:              toNumber(q.regularMarketDayLow ?? 0),
          previousClose,
          volume:           toNumber(q.regularMarketVolume ?? 0),
          fiftyTwoWeekHigh: toNumber(q.fiftyTwoWeekHigh),
          fiftyTwoWeekLow:  toNumber(q.fiftyTwoWeekLow),
          marketCap:        0,
        };
      })
    );
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) all.push(r.value);
    });
  }
  return all;
}