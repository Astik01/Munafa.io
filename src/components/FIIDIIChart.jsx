import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const PLACEHOLDER_DATA = [
  { date: '24 Mar', fii: -1245, dii: 1876 },
  { date: '25 Mar', fii: 892,  dii: -543  },
  { date: '26 Mar', fii: -2103, dii: 2450 },
  { date: '27 Mar', fii: 567,  dii: 312   },
  { date: '28 Mar', fii: -1890, dii: 1678 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <Paper
      elevation={2}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Typography
          key={entry.dataKey}
          variant="body2"
          sx={{ color: entry.color, fontWeight: 600 }}
        >
          {entry.name}: ₹{Math.abs(entry.value).toLocaleString('en-IN')} Cr
          {entry.value >= 0 ? ' (Buy)' : ' (Sell)'}
        </Typography>
      ))}
    </Paper>
  );
}

function FIIDIIChart({ data }) {
  const chartData = data && data.length > 0 ? data : PLACEHOLDER_DATA;

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease 0.1s', animationFillMode: 'both' }}>
      <Typography className="section-title">FII / DII Activity (₹ Cr)</Typography>
      <Paper
        elevation={0}
        className="glass-card"
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.03)'
              : '#FFFFFF',
        }}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4} barCategoryGap="25%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(128,128,128,0.12)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v >= 0 ? '' : '-'}₹${Math.abs(v)}`}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}
            />
            <Bar
              dataKey="fii"
              name="FII"
              fill="#5C6BC0"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="dii"
              name="DII"
              fill="#26A69A"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}

export default FIIDIIChart;
