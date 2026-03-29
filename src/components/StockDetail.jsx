import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  ButtonGroup,
  Button,
  LinearProgress,
  Stack
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  formatINR,
  formatChange,
  formatDate,
  formatVolume
} from '../utils/formatters';

const CHART_TYPES = ['area', 'bar', 'candlestick'];
const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y'];

function StatsCard({ label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.6)' }}
      >
        {label}
      </Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        backgroundColor: '#12121A',
        border: '1px solid rgba(255,255,255,0.12)'
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {formatDate(datum.timestamp)}
      </Typography>
      <Typography variant="body2">
        O: {formatINR(datum.open)}
      </Typography>
      <Typography variant="body2">
        H: {formatINR(datum.high)}
      </Typography>
      <Typography variant="body2">
        L: {formatINR(datum.low)}
      </Typography>
      <Typography variant="body2">
        C: {formatINR(datum.close)}
      </Typography>
      <Typography variant="body2">
        Vol: {formatVolume(datum.volume)}
      </Typography>
    </Box>
  );
}

function buildCandleData(chartData) {
  return (chartData || []).map((d) => ({
    ...d,
    highLow: d.high - d.low,
    body: d.close - d.open,
    positive: d.close >= d.open
  }));
}

function StockDetail({
  stock,
  chartData,
  chartLoading,
  chartType,
  timeRange,
  onChartTypeChange,
  onTimeRangeChange
}) {
  if (!stock) {
    return (
      <Box
        sx={{
          flex: 6,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(10px)',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 4
        }}
      >
        <TrendingUpIcon
          sx={{
            fontSize: 56,
            mb: 1,
            color: '#00C853',
            animation: 'pulse 1.8s infinite ease-in-out'
          }}
        />
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Select a stock to view details
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Choose a company from the list to see price action, stats, and historical charts.
        </Typography>
      </Box>
    );
  }

  const positive = stock.changePercent > 0;

  const candleData = buildCandleData(chartData || []);
  const areaBarData = chartData || [];

  const current = stock.price;
  const low52 = stock.fiftyTwoWeekLow || current;
  const high52 = stock.fiftyTwoWeekHigh || current;
  let position = 50;
  if (high52 !== low52) {
    position = ((current - low52) / (high52 - low52)) * 100;
    position = Math.max(0, Math.min(100, position));
  }

  return (
    <Box
      sx={{
        flex: 6,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(10px)',
        mr: { md: 2, xs: 0 },
        mb: { md: 0, xs: 2 },
        overflow: 'hidden'
      }}
    >
      {chartLoading && <LinearProgress color="primary" />}

      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stock.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {stock.symbol}
              </Typography>
            </Box>
            <Chip
              label={stock.sector}
              sx={{
                borderRadius: 999,
                bgcolor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: stock.color,
                fontWeight: 600
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={3}
            alignItems="flex-end"
            flexWrap="wrap"
          >
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, lineHeight: 1 }}
            >
              {formatINR(stock.price)}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25
                    }}
                  >
                    {positive ? (
                      <ArrowDropUpIcon sx={{ fontSize: 22 }} />
                    ) : (
                      <ArrowDropDownIcon sx={{ fontSize: 22 }} />
                    )}
                    <span>{formatINR(stock.change)}</span>
                    <span>({formatChange(stock.changePercent)})</span>
                  </Box>
                }
                sx={{
                  bgcolor: positive
                    ? 'rgba(0,200,83,0.16)'
                    : 'rgba(255,82,82,0.16)',
                  color: positive ? '#00C853' : '#FF5252',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontWeight: 600
                }}
              />
            </Stack>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatsCard label="Open" value={formatINR(stock.open)} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatsCard label="High" value={formatINR(stock.high)} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatsCard label="Low" value={formatINR(stock.low)} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatsCard
                label="Prev Close"
                value={formatINR(stock.previousClose)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatsCard
                label="Volume"
                value={formatVolume(stock.volume)}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.6)' }}
            >
              52-week range
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography variant="caption">
                  {formatINR(low52)}
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    background:
                      'linear-gradient(90deg, #FF5252, #FFB300, #00C853)'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${position}%`,
                      transform: 'translateX(-50%)',
                      top: '50%',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      boxShadow: '0 0 0 3px rgba(0,0,0,0.6)'
                    }}
                  />
                </Box>
                <Typography variant="caption">
                  {formatINR(high52)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          px: 2.5,
          pt: 1.5,
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={(_, v) => v && onChartTypeChange && onChartTypeChange(v)}
          size="small"
          sx={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 999
          }}
        >
          {CHART_TYPES.map((type) => (
            <ToggleButton
              key={type}
              value={type}
              sx={{ textTransform: 'none', px: 1.5 }}
            >
              {type.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <ButtonGroup
          size="small"
          sx={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 999
          }}
        >
          {TIME_RANGES.map((range) => (
            <Button
              key={range}
              onClick={() =>
                onTimeRangeChange && onTimeRangeChange(range)
              }
              sx={{
                textTransform: 'none',
                px: 1.4,
                borderRadius: 999,
                bgcolor:
                  timeRange === range
                    ? 'rgba(0,200,83,0.2)'
                    : 'transparent',
                color:
                  timeRange === range
                    ? '#00C853'
                    : 'rgba(255,255,255,0.8)',
                '&:hover': {
                  bgcolor:
                    timeRange === range
                      ? 'rgba(0,200,83,0.25)'
                      : 'rgba(255,255,255,0.05)'
                }
              }}
            >
              {range}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Box sx={{ flex: 1, minHeight: 260, p: 1.5 }}>
        {(!chartData || chartData.length === 0) && !chartLoading ? (
          <Box
            sx={{
              height: '100%',
              borderRadius: 2,
              border: '1px dashed rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            <BarChartIcon
              sx={{
                fontSize: 40,
                mb: 1,
                color: 'rgba(255,255,255,0.6)'
              }}
            />
            <Typography variant="body2">
              No chart data available for this range.
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {chartType === 'area' && (
              <AreaChart data={areaBarData}>
                <defs>
                  <linearGradient
                    id="areaColor"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#00C853"
                      stopOpacity={0.7}
                    />
                    <stop
                      offset="100%"
                      stopColor="#00C853"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11 }}
                  minTickGap={20}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tickFormatter={(v) => `₹${Math.round(v)}`}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#00C853"
                  strokeWidth={2}
                  fill="url(#areaColor)"
                  isAnimationActive
                />
              </AreaChart>
            )}

            {chartType === 'bar' && (
              <BarChart data={areaBarData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11 }}
                  minTickGap={20}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tickFormatter={(v) =>
                    v >= 1e7
                      ? `${(v / 1e7).toFixed(1)}Cr`
                      : v >= 1e5
                      ? `${(v / 1e5).toFixed(1)}L`
                      : `${Math.round(v)}`
                  }
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="volume"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive
                >
                  {areaBarData.map((entry, index) => (
                    <Cell
                      // eslint-disable-next-line react/no-array-index-key
                      key={`cell-${index}`}
                      fill={
                        entry.close >= entry.open ? '#00C853' : '#FF5252'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            )}

            {chartType === 'candlestick' && (
              <ComposedChart data={candleData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11 }}
                  minTickGap={20}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tickFormatter={(v) => `₹${Math.round(v)}`}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />

                <Bar
                  dataKey="highLow"
                  barSize={2}
                  stroke="rgba(255,255,255,0.6)"
                  fill="rgba(255,255,255,0.0)"
                />
                <Bar
                  dataKey="body"
                  barSize={8}
                  radius={[2, 2, 2, 2]}
                >
                  {candleData.map((entry, index) => (
                    <Cell
                      // eslint-disable-next-line react/no-array-index-key
                      key={`cell-body-${index}`}
                      fill={entry.positive ? '#00C853' : '#FF5252'}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
}

export default StockDetail;

