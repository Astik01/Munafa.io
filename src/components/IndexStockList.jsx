import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Skeleton, Button, IconButton, ToggleButtonGroup, ToggleButton,
  ButtonGroup, Grid, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis,
  Tooltip as RTooltip,
} from 'recharts';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import Navbar from './Navbar';
import { INDEX_META, INDEX_CONSTITUENTS } from '../data/indexConstituents';
import { fetchIndexQuote, fetchStocksBatch, fetchStockChart } from '../services/stockService';
import { formatINR, formatVolume, formatDate } from '../utils/formatters';
import { getMarketStatus } from '../utils/marketUtils';

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y'];
const CHART_TYPES = ['line', 'candlestick', 'area'];

/* ── Chart tooltip ─────────────────────────────────────── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Paper sx={{ px: 1.5, py: 1, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatDate(d.timestamp)}</Typography>
      <Typography variant="body2">O: {formatINR(d.open)} H: {formatINR(d.high)}</Typography>
      <Typography variant="body2">L: {formatINR(d.low)} C: {formatINR(d.close)}</Typography>
    </Paper>
  );
}

/* ── Candlestick chart (lightweight-charts) ────────────── */
function CandlestickChart({ data, isDark }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth, height: 320,
      layout: { background: { color: 'transparent' }, textColor: isDark ? 'rgba(240,240,245,0.6)' : 'rgba(26,26,46,0.6)' },
      grid: { vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' } },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26A65B', downColor: '#E74C3C',
      borderUpColor: '#26A65B', borderDownColor: '#E74C3C',
      wickUpColor: '#26A65B', wickDownColor: '#E74C3C',
    });

    const seen = new Set();
    const candleData = data.map((d) => ({
      time: Math.floor(new Date(d.timestamp).getTime() / 1000),
      open: d.open, high: d.high, low: d.low, close: d.close,
    })).filter((d) => { if (seen.has(d.time)) return false; seen.add(d.time); return true; })
      .sort((a, b) => a.time - b.time);

    series.setData(candleData);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [data, isDark]);

  return <div ref={containerRef} style={{ width: '100%', minHeight: 320 }} />;
}

/* ── Main component ────────────────────────────────────── */
function IndexStockList() {
  const { indexSymbol } = useParams();
  const navigate = useNavigate();
  const isDark = typeof document !== 'undefined' && document.body.style.backgroundColor === '#0A0F1E';

  const indexInfo = INDEX_META[indexSymbol];
  const constituents = INDEX_CONSTITUENTS[indexSymbol] || [];
  const marketStatus = getMarketStatus();

  const [indexData, setIndexData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('1M');
  const [chartLoading, setChartLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch index quote
  useEffect(() => {
    if (!indexInfo) return;
    fetchIndexQuote(indexInfo.yahooSymbol).then((d) => d && setIndexData(d)).catch(() => {});
  }, [indexInfo]);

  // Fetch index chart
  useEffect(() => {
    if (!indexInfo) return;
    let cancelled = false;
    async function loadChart() {
      setChartLoading(true);
      try {
        // fetchStockChart accepts symbol, range — we pass yahoo symbol directly
        const yahooSym = indexInfo.yahooSymbol.replace('^', '%5E');
        const data = await fetchIndexChart(indexInfo.yahooSymbol, timeRange);
        if (!cancelled) setChartData(data || []);
      } catch (e) { console.error(e); }
      if (!cancelled) setChartLoading(false);
    }
    loadChart();
    return () => { cancelled = true; };
  }, [indexInfo, timeRange]);

  // Fetch constituent stocks
  useEffect(() => {
    if (!constituents.length) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setStocks([]);
      try {
        for (let i = 0; i < constituents.length; i += 8) {
          if (cancelled) break;
          const batch = constituents.slice(i, i + 8);
          const results = await fetchStocksBatch(batch, 8);
          if (!cancelled) setStocks((prev) => [...prev, ...results]);
          if (i + 8 < constituents.length) await new Promise((r) => setTimeout(r, 500));
        }
      } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [indexSymbol]);

  // Sort by change% desc (top gainers first), filter by search
  const filtered = useMemo(() => {
    let arr = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return arr;
  }, [stocks, search]);

  const positive = indexData?.changePercent >= 0;
  const color = positive ? '#26A65B' : '#E74C3C';

  if (!indexInfo) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5">Index "{indexSymbol}" not found</Typography>
          <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Back to Dashboard</Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* ── Back + header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}
            sx={{ color: 'inherit', fontWeight: 600, '&:hover': { color: '#5C6BC0' } }}>
            Back
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{indexInfo.name}</Typography>
            <Chip size="small" label={marketStatus?.label || 'Loading'}
              sx={{
                height: 22, fontSize: 11, fontWeight: 700, borderRadius: 999,
                bgcolor: marketStatus?.isOpen ? 'rgba(38,166,91,0.12)' : 'rgba(231,76,60,0.12)',
                color: marketStatus?.isOpen ? '#26A65B' : '#E74C3C',
              }}
            />
          </Box>
        </Box>

        {/* ═══ SECTION A — Index Chart ═══ */}
        <Paper elevation={0} className="glass-card" sx={{
          borderRadius: 3, mb: 3, overflow: 'hidden',
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
        }}>
          {chartLoading && <LinearProgress sx={{ height: 2 }} />}

          {/* Chart header */}
          <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
            {indexData ? (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {indexData.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Typography>
                <Chip
                  icon={positive ? <ArrowDropUpIcon sx={{ color: `${color} !important` }} /> : <ArrowDropDownIcon sx={{ color: `${color} !important` }} />}
                  label={`${positive ? '+' : ''}${indexData.changePercent.toFixed(2)}%`}
                  sx={{ bgcolor: positive ? 'rgba(38,166,91,0.12)' : 'rgba(231,76,60,0.12)', color, fontWeight: 700, borderRadius: 999 }}
                />
              </Box>
            ) : (
              <Skeleton width={250} height={48} />
            )}
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, px: 2.5, pb: 1 }}>
            <ToggleButtonGroup value={chartType} exclusive onChange={(_, v) => v && setChartType(v)} size="small"
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, fontWeight: 600 } }}>
              {CHART_TYPES.map((t) => <ToggleButton key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</ToggleButton>)}
            </ToggleButtonGroup>
            <ButtonGroup size="small">
              {TIME_RANGES.map((r) => (
                <Button key={r} onClick={() => setTimeRange(r)} sx={{
                  px: 1.5, fontWeight: 600, borderRadius: 999,
                  bgcolor: timeRange === r ? 'rgba(92,107,192,0.2)' : 'transparent',
                  color: timeRange === r ? '#5C6BC0' : 'inherit',
                }}>{r}</Button>
              ))}
            </ButtonGroup>
          </Box>

          {/* Chart */}
          <Box sx={{ px: 1.5, pb: 1.5, minHeight: 320 }}>
            {chartData.length === 0 && !chartLoading ? (
              <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <Typography>No chart data available</Typography>
              </Box>
            ) : chartType === 'candlestick' ? (
              <CandlestickChart data={chartData} isDark={isDark} />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="indexAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={chartType === 'area' ? 0.5 : 0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatDate} tick={{ fontSize: 11 }} minTickGap={30} />
                  <YAxis tickFormatter={(v) => v >= 10000 ? `${(v/1000).toFixed(0)}K` : `${Math.round(v)}`} tick={{ fontSize: 11 }} width={55} />
                  <RTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2}
                    fill={chartType === 'area' ? 'url(#indexAreaGrad)' : 'none'} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>

          {/* Key stats strip */}
          {indexData && chartData.length > 0 && (
            <Box sx={{ px: 2.5, pb: 2 }}>
              <Grid container spacing={1}>
                {[
                  { label: 'Open', value: formatINR(chartData[0]?.open) },
                  { label: 'High', value: formatINR(Math.max(...chartData.map(d => d.high).filter(Boolean))) },
                  { label: 'Low',  value: formatINR(Math.min(...chartData.filter(d => d.low > 0).map(d => d.low))) },
                  { label: 'Close', value: formatINR(chartData.at(-1)?.close) },
                  { label: 'Volume', value: formatVolume(chartData.reduce((s, d) => s + (d.volume || 0), 0)) },
                ].map((s) => (
                  <Grid item xs={6} sm={4} md key={s.label}>
                    <Box sx={{
                      px: 1.5, py: 1, borderRadius: 2,
                      background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: (t) => `1px solid ${t.palette.divider}`,
                    }}>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>{s.label}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>

        {/* ═══ SECTION B — Constituent Stocks ═══ */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Stocks in {indexInfo.name}
        </Typography>

        <TextField
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company name or symbol" size="small" fullWidth
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 999, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ opacity: 0.5 }} /></InputAdornment> }}
        />

        <Paper elevation={0} className="glass-card" sx={{
          borderRadius: 3, overflow: 'hidden',
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
        }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['#', 'Company', 'LTP (₹)', 'Change', 'Change %', 'Volume', '52W High', '52W Low'].map((h, i) => (
                    <TableCell key={h} align={i > 1 ? 'right' : 'left'}
                      sx={{ fontWeight: 700, fontSize: 12, opacity: 0.6, display: i > 5 ? { xs: 'none', md: 'table-cell' } : 'table-cell' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && stocks.length === 0 ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} align={j > 1 ? 'right' : 'left'}
                          sx={{ display: j > 5 ? { xs: 'none', md: 'table-cell' } : 'table-cell' }}>
                          <Skeleton width={j === 1 ? 140 : 70} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.map((stock, i) => {
                  const p = stock.changePercent >= 0;
                  const c = p ? '#26A65B' : '#E74C3C';
                  return (
                    <TableRow key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)}
                      sx={{
                        cursor: 'pointer', transition: 'background-color 0.15s',
                        bgcolor: i % 2 === 0 ? 'transparent' : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                        '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(92,107,192,0.08)' : 'rgba(92,107,192,0.04)' },
                      }}>
                      <TableCell sx={{ fontWeight: 600, opacity: 0.5, width: 40 }}>{i + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{stock.name}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.5 }}>{stock.symbol}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{formatINR(stock.price)}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: c, fontWeight: 600 }}>{p ? '+' : ''}{formatINR(stock.change)}</TableCell>
                      <TableCell align="right">
                        <Chip size="small"
                          icon={p ? <ArrowDropUpIcon sx={{ fontSize: 14, color: `${c} !important` }} /> : <ArrowDropDownIcon sx={{ fontSize: 14, color: `${c} !important` }} />}
                          label={`${p ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
                          sx={{ bgcolor: p ? 'rgba(38,166,91,0.12)' : 'rgba(231,76,60,0.12)', color: c, fontWeight: 700, borderRadius: 999, height: 22, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ opacity: 0.7 }}>{formatVolume(stock.volume)}</TableCell>
                      <TableCell align="right" sx={{ opacity: 0.7, display: { xs: 'none', md: 'table-cell' } }}>{formatINR(stock.fiftyTwoWeekHigh)}</TableCell>
                      <TableCell align="right" sx={{ opacity: 0.7, display: { xs: 'none', md: 'table-cell' } }}>{formatINR(stock.fiftyTwoWeekLow)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {loading && stocks.length > 0 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>Loading more stocks… ({stocks.length}/{constituents.length})</Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

/* ── Fetch index chart data using Yahoo symbol directly ── */
async function fetchIndexChart(yahooSymbol, range) {
  const API_BASE = '/api/yahoo';
  const paramMap = {
    '1D': { interval: '5m',  range: '1d' },
    '1W': { interval: '15m', range: '5d' },
    '1M': { interval: '1d',  range: '1mo' },
    '3M': { interval: '1d',  range: '3mo' },
    '1Y': { interval: '1wk', range: '1y' },
  };
  const { interval, range: yfRange } = paramMap[range] || paramMap['1M'];
  const url = `${API_BASE}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${yfRange}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return [];

  const timestamps = result.timestamp || [];
  const q = result.indicators?.quote?.[0] || {};
  return timestamps.map((ts, i) => ({
    timestamp: new Date(ts * 1000).toISOString(),
    time: ts,
    open: Number(q.open?.[i]) || 0,
    high: Number(q.high?.[i]) || 0,
    low: Number(q.low?.[i]) || 0,
    close: Number(q.close?.[i]) || 0,
    volume: Number(q.volume?.[i]) || 0,
  })).filter((d) => d.close > 0);
}

export default IndexStockList;
