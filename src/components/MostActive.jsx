import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, Tabs, Tab } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const MOCK_ACTIVE = [
  { name: 'Reliance Ind',    symbol: 'RELIANCE',  price: 1348.10, change: -4.69, volume: '23.2Cr' },
  { name: 'HDFC Bank',       symbol: 'HDFCBANK',  price: 756.20,  change: -3.11, volume: '14.5Cr' },
  { name: 'ICICI Bank',      symbol: 'ICICIBANK', price: 1278.90, change: 1.56,  volume: '9.7Cr'  },
  { name: 'Tata Motors',     symbol: 'TATAMOTORS',price: 678.40,  change: 2.34,  volume: '8.9Cr'  },
  { name: 'SBI',             symbol: 'SBIN',      price: 834.20,  change: -0.89, volume: '7.6Cr'  },
  { name: 'Infosys',         symbol: 'INFY',      price: 1269.70, change: 3.91,  volume: '8.7Cr'  },
];

const MOCK_BOUGHT = [
  { name: 'Tata Power',      symbol: 'TATAPOWER', price: 412.30,  change: 5.82,  volume: '18.4Cr' },
  { name: 'IRFC',            symbol: 'IRFC',      price: 162.35,  change: 8.45,  volume: '22.1Cr' },
  { name: 'NHPC',            symbol: 'NHPC',      price: 89.70,   change: 6.78,  volume: '31.5Cr' },
  { name: 'Power Grid',      symbol: 'POWERGRID', price: 312.50,  change: 2.45,  volume: '9.3Cr'  },
  { name: 'Wipro',           symbol: 'WIPRO',     price: 242.85,  change: 2.78,  volume: '15.6Cr' },
  { name: 'NTPC',            symbol: 'NTPC',      price: 348.75,  change: 4.15,  volume: '12.1Cr' },
];

function StockCard({ stock, onClick }) {
  const positive = stock.change >= 0;
  const color = positive ? '#26A65B' : '#E74C3C';

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
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {stock.name}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.5 }}>
        {stock.symbol}
      </Typography>

      <Typography
        variant="h6"
        sx={{ fontWeight: 700, mt: 1, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5 }}>
        {positive ? (
          <ArrowDropUpIcon sx={{ color, fontSize: 18 }} />
        ) : (
          <ArrowDropDownIcon sx={{ color, fontSize: 18 }} />
        )}
        <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
          {positive ? '+' : ''}{stock.change.toFixed(2)}%
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ opacity: 0.5, mt: 0.5, display: 'block' }}>
        Vol: {stock.volume}
      </Typography>
    </Paper>
  );
}

function MostActive({ activeData, boughtData }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const active = activeData || MOCK_ACTIVE;
  const bought = boughtData || MOCK_BOUGHT;
  const data = tab === 0 ? active : bought;

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease 0.1s', animationFillMode: 'both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography className="section-title" sx={{ mb: '0 !important' }}>
          {tab === 0 ? 'Most Active' : 'Most Bought'}
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#5C6BC0', height: 2 } }}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              minWidth: 'auto',
              px: 1.5,
              minHeight: 36,
            },
          }}
        >
          <Tab label="🔥 Most Active" />
          <Tab label="🛒 Most Bought" />
        </Tabs>
      </Box>
      <Box className="scroll-row">
        {data.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} onClick={() => navigate(`/stock/${stock.symbol}`)} />
        ))}
      </Box>
    </Box>
  );
}

export default MostActive;
