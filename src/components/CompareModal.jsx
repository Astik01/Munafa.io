import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Autocomplete,
  TextField, Chip, ButtonGroup, Typography, CircularProgress, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis,
  Tooltip as RTooltip, Legend,
} from 'recharts';
import { STOCKS, fetchStockChart } from '../services/stockService';
import { formatDate } from '../utils/formatters';

const TIME_RANGES = ['1M', '3M', '6M', '1Y'];
const MAX_STOCKS = 5;
const LINE_COLORS = ['#5C6BC0', '#26A65B', '#E74C3C', '#F39C12', '#9C27B0'];

function CompareTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      px: 1.5, py: 1, borderRadius: 2, bgcolor: 'background.paper',
      border: (t) => `1px solid ${t.palette.divider}`,
    }}>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
        {formatDate(label)}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.dataKey} variant="caption" sx={{ display: 'block', color: p.color }}>
          {p.dataKey}: {p.value >= 0 ? '+' : ''}{p.value?.toFixed(2)}%
        </Typography>
      ))}
    </Box>
  );
}

function CompareModal({ open, onClose }) {
  const [selected, setSelected] = useState([]);
  const [range, setRange] = useState('3M');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Reset selection each time modal is closed, so it opens fresh next time
  useEffect(() => {
    if (!open) {
      setSelected([]);
      setChartData([]);
      setError(false);
    }
  }, [open]);

  useEffect(() => {
    if (selected.length === 0) {
      setChartData([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const results = await Promise.all(
          selected.map(async (s) => ({
            symbol: s.symbol,
            data: await fetchStockChart(s.symbol, range),
          }))
        );
        if (cancelled) return;

        // Normalize each series to % change from its own first close
        const normalized = results.map(({ symbol, data }) => {
          const firstClose = data.find((d) => d.close > 0)?.close;
          return {
            symbol,
            points: data
              .filter((d) => d.close > 0)
              .map((d) => ({
                timestamp: d.timestamp,
                pct: firstClose ? ((d.close - firstClose) / firstClose) * 100 : 0,
              })),
          };
        });

        // Merge into one row-per-timestamp dataset (union of all timestamps)
        const rowMap = new Map();
        normalized.forEach(({ symbol, points }) => {
          points.forEach(({ timestamp, pct }) => {
            if (!rowMap.has(timestamp)) rowMap.set(timestamp, { timestamp });
            rowMap.get(timestamp)[symbol] = pct;
          });
        });

        const merged = Array.from(rowMap.values()).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        if (!cancelled) setChartData(merged);
      } catch (e) {
        console.error('Compare fetch error:', e);
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [selected, range]);

  const availableOptions = useMemo(
    () => STOCKS.filter((s) => !selected.some((sel) => sel.symbol === s.symbol)),
    [selected]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Compare Stocks
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Autocomplete
          multiple
          options={availableOptions}
          getOptionLabel={(o) => `${o.symbol} — ${o.name}`}
          value={selected}
          onChange={(_, value) => setSelected(value.slice(0, MAX_STOCKS))}
          disabled={selected.length >= MAX_STOCKS}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.symbol}
                label={option.symbol}
                size="small"
                sx={{ bgcolor: LINE_COLORS[index] + '22', color: LINE_COLORS[index], fontWeight: 700 }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selected.length >= MAX_STOCKS ? `Max ${MAX_STOCKS} stocks` : 'Add stocks to compare…'}
              size="small"
            />
          )}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ButtonGroup size="small">
            {TIME_RANGES.map((r) => (
              <Button
                key={r}
                onClick={() => setRange(r)}
                sx={{
                  px: 1.5, fontWeight: 600,
                  bgcolor: range === r ? 'rgba(92,107,192,0.2)' : 'transparent',
                  color: range === r ? '#5C6BC0' : 'inherit',
                }}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        <Box sx={{ height: 380 }}>
          {selected.length === 0 ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                Select 2 or more stocks above to compare their performance
              </Typography>
            </Box>
          ) : loading ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : error ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>Couldn't load comparison data. Try again.</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={formatDate} tick={{ fontSize: 11 }} minTickGap={40} />
                <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} width={50} />
                <RTooltip content={<CompareTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {selected.map((s, i) => (
                  <Line
                    key={s.symbol}
                    type="monotone"
                    dataKey={s.symbol}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompareModal;