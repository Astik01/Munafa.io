import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Chip, Grid, IconButton,
  ToggleButtonGroup, ToggleButton, ButtonGroup, Button, Skeleton,
  LinearProgress, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart,
  CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Cell,
} from 'recharts';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import Navbar from './Navbar';
import { fetchStockChart, fetchStocksChunk } from '../services/stockService';
import { formatINR, formatChange, formatVolume, formatDate } from '../utils/formatters';

const TIME_RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y'];
const CHART_TYPES = ['candlestick', 'line', 'bar'];

function StatsCard({ label, value }) {
  return (
    <Paper elevation={0} sx={{
      px: 1.5, py: 1, borderRadius: 2,
      background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: (t) => `1px solid ${t.palette.divider}`,
    }}>
      <Typography variant="caption" sx={{ opacity: 0.6 }}>{label}</Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</Typography>
    </Paper>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Paper sx={{ px: 1.5, py: 1, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatDate(d.timestamp)}</Typography>
      <Typography variant="body2">O: {formatINR(d.open)} H: {formatINR(d.high)}</Typography>
      <Typography variant="body2">L: {formatINR(d.low)} C: {formatINR(d.close)}</Typography>
      <Typography variant="body2">Vol: {formatVolume(d.volume)}</Typography>
    </Paper>
  );
}

function CandlestickChart({ data, isDark }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 350,
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? 'rgba(240,240,245,0.6)' : 'rgba(26,26,46,0.6)',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
      },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26A65B',
      downColor: '#E74C3C',
      borderUpColor: '#26A65B',
      borderDownColor: '#E74C3C',
      wickUpColor: '#26A65B',
      wickDownColor: '#E74C3C',
    });

    const candleData = data.map((d) => ({
      time: Math.floor(new Date(d.timestamp).getTime() / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    // Deduplicate and sort by time
    const seen = new Set();
    const uniqueData = candleData.filter((d) => {
      if (seen.has(d.time)) return false;
      seen.add(d.time);
      return true;
    }).sort((a, b) => a.time - b.time);

    series.setData(uniqueData);
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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, isDark]);

  return <div ref={containerRef} style={{ width: '100%', minHeight: 350 }} />;
}

function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  const [stock, setStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('candlestick');
  const [timeRange, setTimeRange] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  const isDark = document.documentElement.classList.contains('dark') ||
    document.body.style.backgroundColor === '#0A0F1E' ||
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  // Load stock quote
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const arr = await fetchStocksChunk([symbol]);
        if (arr?.length) setStock(arr[0]);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [symbol]);

  // Load chart data
  useEffect(() => {
    async function loadChart() {
      setChartLoading(true);
      try {
        const data = await fetchStockChart(symbol, timeRange);
        setChartData(data || []);
      } catch (e) { console.error(e); }
      setChartLoading(false);
    }
    loadChart();
  }, [symbol, timeRange]);

  const positive = stock?.changePercent >= 0;
  const color = positive ? '#26A65B' : '#E74C3C';

  // 52W range position
  const position = useMemo(() => {
    if (!stock) return 50;
    const { price, fiftyTwoWeekLow: lo, fiftyTwoWeekHigh: hi } = stock;
    if (hi === lo) return 50;
    return Math.max(0, Math.min(100, ((price - lo) / (hi - lo)) * 100));
  }, [stock]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Back button */}
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'inherit', fontWeight: 600, '&:hover': { color: '#5C6BC0' } }}
          >
            Back
          </Button>
        </Box>

        {loading ? (
          <Box>
            <Skeleton variant="text" width={250} height={40} />
            <Skeleton variant="text" width={180} height={56} />
            <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 3, mt: 2 }} />
          </Box>
        ) : !stock ? (
          <Typography>Stock data unavailable for {symbol}</Typography>
        ) : (
          <>
            {/* Header Strip */}
            <Paper elevation={0} className="glass-card" sx={{
              p: 3, borderRadius: 3, mb: 3,
              border: (t) => `1px solid ${t.palette.divider}`,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{stock.name}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.6 }}>{stock.symbol}.NS</Typography>
                </Box>
                <Tooltip title="Add to Watchlist">
                  <IconButton sx={{ color: '#5C6BC0' }}>
                    <BookmarkBorderIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {formatINR(stock.price)}
                </Typography>
                <Chip
                  icon={positive ? <ArrowDropUpIcon sx={{ color: `${color} !important` }} /> : <ArrowDropDownIcon sx={{ color: `${color} !important` }} />}
                  label={`${formatINR(stock.change)} (${formatChange(stock.changePercent)})`}
                  sx={{
                    bgcolor: positive ? 'rgba(38,166,91,0.12)' : 'rgba(231,76,60,0.12)',
                    color, fontWeight: 700, borderRadius: 999,
                  }}
                />
              </Box>

              <Grid container spacing={1.5} sx={{ mt: 2 }}>
                <Grid item xs={6} sm={4} md={2}><StatsCard label="Open" value={formatINR(stock.open)} /></Grid>
                <Grid item xs={6} sm={4} md={2}><StatsCard label="High" value={formatINR(stock.high)} /></Grid>
                <Grid item xs={6} sm={4} md={2}><StatsCard label="Low" value={formatINR(stock.low)} /></Grid>
                <Grid item xs={6} sm={4} md={2}><StatsCard label="Prev Close" value={formatINR(stock.previousClose)} /></Grid>
                <Grid item xs={6} sm={4} md={2}><StatsCard label="Volume" value={formatVolume(stock.volume)} /></Grid>
                <Grid item xs={6} sm={4} md={2}><StatsCard label="52W High" value={formatINR(stock.fiftyTwoWeekHigh)} /></Grid>
              </Grid>

              {/* 52W Range bar */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>52-week range</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption">{formatINR(stock.fiftyTwoWeekLow)}</Typography>
                  <Box sx={{ position: 'relative', flex: 1, height: 6, borderRadius: 999, background: 'linear-gradient(90deg, #E74C3C, #F39C12, #26A65B)' }}>
                    <Box sx={{ position: 'absolute', left: `${position}%`, transform: 'translateX(-50%)', top: '50%', width: 12, height: 12, borderRadius: '50%', bgcolor: '#fff', boxShadow: '0 0 0 3px rgba(0,0,0,0.5)', mt: '-6px' }} />
                  </Box>
                  <Typography variant="caption">{formatINR(stock.fiftyTwoWeekHigh)}</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Chart Controls */}
            <Paper elevation={0} className="glass-card" sx={{
              borderRadius: 3, mb: 3, overflow: 'hidden',
              border: (t) => `1px solid ${t.palette.divider}`,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
            }}>
              {chartLoading && <LinearProgress sx={{ height: 2 }} />}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, px: 2.5, pt: 2, pb: 1 }}>
                <ToggleButtonGroup
                  value={chartType} exclusive
                  onChange={(_, v) => v && setChartType(v)}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, fontWeight: 600 } }}
                >
                  {CHART_TYPES.map((t) => (
                    <ToggleButton key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <ButtonGroup size="small">
                  {TIME_RANGES.map((r) => (
                    <Button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      sx={{
                        px: 1.5, fontWeight: 600, borderRadius: 999,
                        bgcolor: timeRange === r ? 'rgba(92,107,192,0.2)' : 'transparent',
                        color: timeRange === r ? '#5C6BC0' : 'inherit',
                      }}
                    >{r}</Button>
                  ))}
                </ButtonGroup>
              </Box>

              {/* Chart area */}
              <Box sx={{ px: 1.5, pb: 1.5, minHeight: 350 }}>
                {chartData.length === 0 && !chartLoading ? (
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <Typography>No chart data for this range</Typography>
                  </Box>
                ) : chartType === 'candlestick' ? (
                  <CandlestickChart data={chartData} isDark={isDark} />
                ) : chartType === 'line' ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5C6BC0" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#5C6BC0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                      <XAxis dataKey="timestamp" tickFormatter={formatDate} tick={{ fontSize: 11 }} minTickGap={30} />
                      <YAxis tickFormatter={(v) => `₹${Math.round(v)}`} tick={{ fontSize: 11 }} width={65} />
                      <RTooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="close" stroke="#5C6BC0" strokeWidth={2} fill="url(#areaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                      <XAxis dataKey="timestamp" tickFormatter={formatDate} tick={{ fontSize: 11 }} minTickGap={30} />
                      <YAxis tickFormatter={(v) => v >= 1e7 ? `${(v/1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v/1e5).toFixed(1)}L` : `${Math.round(v)}`} tick={{ fontSize: 11 }} width={65} />
                      <RTooltip content={<ChartTooltip />} />
                      <Bar dataKey="volume" radius={[3,3,0,0]}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={d.close >= d.open ? '#26A65B' : '#E74C3C'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>

              {/* Volume bars below chart (only for candle/line) */}
              {chartType !== 'bar' && chartData.length > 0 && (
                <Box sx={{ px: 1.5, pb: 2 }}>
                  <Typography variant="caption" sx={{ px: 1, opacity: 0.6, fontWeight: 600 }}>Volume</Typography>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={chartData}>
                      <Bar dataKey="volume" radius={[2,2,0,0]}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={d.close >= d.open ? 'rgba(38,166,91,0.5)' : 'rgba(231,76,60,0.5)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}

export default StockDetail;
