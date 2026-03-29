import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const MOCK_COMPANIES = [
  { name: 'Reliance Industries', symbol: 'RELIANCE',  marketCap: '17.8L Cr', price: 1348.10, color: '#FF9800', position: 42 },
  { name: 'TCS',                 symbol: 'TCS',       marketCap: '13.2L Cr', price: 2389.80, color: '#2196F3', position: 65 },
  { name: 'HDFC Bank',           symbol: 'HDFCBANK',  marketCap: '12.1L Cr', price: 756.20,  color: '#9C27B0', position: 38 },
  { name: 'Infosys',             symbol: 'INFY',      marketCap: '6.8L Cr',  price: 1269.70, color: '#2196F3', position: 72 },
  { name: 'ICICI Bank',          symbol: 'ICICIBANK', marketCap: '9.1L Cr',  price: 1278.90, color: '#9C27B0', position: 55 },
  { name: 'Bharti Airtel',       symbol: 'BHARTIARTL',marketCap: '8.4L Cr',  price: 1623.40, color: '#E91E63', position: 81 },
  { name: 'State Bank',          symbol: 'SBIN',      marketCap: '7.5L Cr',  price: 834.20,  color: '#3F51B5', position: 48 },
  { name: 'Bajaj Finance',       symbol: 'BAJFINANCE',marketCap: '4.6L Cr',  price: 7823.40, color: '#673AB7', position: 60 },
  { name: 'Hindustan Unilever',  symbol: 'HINDUNILVR',marketCap: '5.9L Cr',  price: 2512.30, color: '#009688', position: 35 },
  { name: 'ITC',                 symbol: 'ITC',       marketCap: '5.7L Cr',  price: 456.80,  color: '#FF5722', position: 70 },
];

function MiniDonut({ position, color }) {
  const data = [
    { value: position },
    { value: 100 - position },
  ];

  return (
    <Box sx={{ width: 40, height: 40, mx: 'auto', mt: 1 }}>
      <ResponsiveContainer width={40} height={40}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={13}
            outerRadius={18}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill="rgba(128,128,128,0.15)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

function CompanyCard({ company, onClick }) {
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <Paper
      elevation={0}
      className="glass-card"
      onClick={onClick}
      sx={{
        minWidth: 180,
        p: 2,
        borderRadius: 3,
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: (t) =>
          t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
        textAlign: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? '0 6px 20px rgba(92,107,192,0.12)'
              : '0 6px 20px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: company.color,
          width: 44,
          height: 44,
          fontSize: 16,
          fontWeight: 700,
          mx: 'auto',
        }}
      >
        {initials}
      </Avatar>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1.5 }}>
        {company.name}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          mt: 0.5,
        }}
      >
        ₹{company.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </Typography>

      <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.25 }}>
        MCap: {company.marketCap}
      </Typography>

      <MiniDonut position={company.position} color={company.color} />
      <Typography variant="caption" sx={{ opacity: 0.45, fontSize: 10 }}>
        52W Range
      </Typography>
    </Paper>
  );
}

function MostValuable({ companies }) {
  const navigate = useNavigate();
  const data = companies && companies.length > 0 ? companies : MOCK_COMPANIES;

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease 0.3s', animationFillMode: 'both' }}>
      <Typography className="section-title">Most Valuable Companies</Typography>
      <Box className="scroll-row">
        {data.map((c) => (
          <CompanyCard key={c.symbol} company={c} onClick={() => navigate(`/stock/${c.symbol}`)} />
        ))}
      </Box>
    </Box>
  );
}

export default MostValuable;
