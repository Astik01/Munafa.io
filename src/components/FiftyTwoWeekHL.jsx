import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const MOCK_52W_HIGH = [
  { name: 'Trent',           symbol: 'TRENT',      price: 5623.40, high52: 5700.00, distance: -1.34 },
  { name: 'Persistent Sys',  symbol: 'PERSISTENT', price: 4892.15, high52: 4950.00, distance: -1.17 },
  { name: 'Zomato',          symbol: 'ZOMATO',     price: 234.50,  high52: 240.00,  distance: -2.29 },
  { name: 'Tata Power',      symbol: 'TATAPOWER',  price: 412.30,  high52: 420.00,  distance: -1.83 },
  { name: 'IRFC',            symbol: 'IRFC',       price: 162.35,  high52: 168.00,  distance: -3.36 },
  { name: 'Power Grid',      symbol: 'POWERGRID',  price: 312.50,  high52: 318.00,  distance: -1.73 },
];

const MOCK_52W_LOW = [
  { name: 'Vodafone Idea',   symbol: 'IDEA',       price: 12.35,   low52: 11.80,   distance: 4.66  },
  { name: 'Yes Bank',        symbol: 'YESBANK',    price: 21.45,   low52: 19.90,   distance: 7.79  },
  { name: 'JP Power',        symbol: 'JPPOWER',    price: 18.90,   low52: 17.50,   distance: 8.00  },
  { name: 'PNB',             symbol: 'PNB',        price: 98.40,   low52: 92.00,   distance: 6.96  },
  { name: 'Bank of Baroda',  symbol: 'BANKBARODA', price: 245.30,  low52: 230.00,  distance: 6.65  },
  { name: 'Canara Bank',     symbol: 'CANBK',      price: 105.60,  low52: 98.50,   distance: 7.21  },
];

function FiftyTwoWeekHL({ highData, lowData }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const highs = highData || MOCK_52W_HIGH;
  const lows = lowData || MOCK_52W_LOW;
  const rows = tab === 0 ? highs : lows;
  const isHigh = tab === 0;

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease 0.25s', animationFillMode: 'both' }}>
      <Typography className="section-title">52 Week High / Low</Typography>
      <Paper
        elevation={0}
        className="glass-card"
        sx={{
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            TabIndicatorProps={{
              style: { backgroundColor: tab === 0 ? '#26A65B' : '#E74C3C', height: 3 },
            }}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
            }}
          >
            <Tab label="📈 52 Week High" />
            <Tab label="📉 52 Week Low" />
          </Tabs>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>Stock</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>
                  Price (₹)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>
                  {isHigh ? '52W High' : '52W Low'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>
                  Distance
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow
                  key={row.symbol}
                  onClick={() => navigate(`/stock/${row.symbol}`)}
                  sx={{
                    bgcolor: (t) =>
                      i % 2 === 0
                        ? 'transparent'
                        : t.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.02)',
                    '&:hover': {
                      bgcolor: (t) =>
                        t.palette.mode === 'dark'
                          ? 'rgba(92,107,192,0.08)'
                          : 'rgba(92,107,192,0.04)',
                    },
                    cursor: 'pointer',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>
                      {row.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      ₹{row.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.7 }}>
                      ₹{(isHigh ? row.high52 : row.low52).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      icon={
                        isHigh ? (
                          <ArrowDropDownIcon sx={{ fontSize: 14, color: '#E74C3C !important' }} />
                        ) : (
                          <ArrowDropUpIcon sx={{ fontSize: 14, color: '#26A65B !important' }} />
                        )
                      }
                      label={`${isHigh ? '' : '+'}${isHigh ? row.distance : row.distance}%`}
                      sx={{
                        bgcolor: isHigh ? 'rgba(231,76,60,0.1)' : 'rgba(38,166,91,0.1)',
                        color: isHigh ? '#E74C3C' : '#26A65B',
                        fontWeight: 600,
                        borderRadius: 999,
                        height: 22,
                        fontSize: 11,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default FiftyTwoWeekHL;
