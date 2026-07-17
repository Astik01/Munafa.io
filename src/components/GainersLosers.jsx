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

const MOCK_GAINERS = {
  large: [
    { rank: 1, name: 'Tata Power',       symbol: 'TATAPOWER',  price: 412.30, change: 5.82,  volume: '18.4Cr' },
    { rank: 2, name: 'NTPC',             symbol: 'NTPC',       price: 348.75, change: 4.15,  volume: '12.1Cr' },
    { rank: 3, name: 'Infosys',          symbol: 'INFY',       price: 1269.70,change: 3.91,  volume: '8.7Cr'  },
    { rank: 4, name: 'Bajaj Finance',    symbol: 'BAJFINANCE', price: 7823.40,change: 3.24,  volume: '4.2Cr'  },
    { rank: 5, name: 'Wipro',            symbol: 'WIPRO',      price: 242.85, change: 2.78,  volume: '15.6Cr' },
    { rank: 6, name: 'Power Grid',       symbol: 'POWERGRID',  price: 312.50, change: 2.45,  volume: '9.3Cr'  },
    { rank: 7, name: 'Sun Pharma',       symbol: 'SUNPHARMA',  price: 1785.60,change: 2.12,  volume: '3.8Cr'  },
    { rank: 8, name: 'Titan Company',    symbol: 'TITAN',      price: 3456.20,change: 1.87,  volume: '2.1Cr'  },
  ],
  mid: [
    { rank: 1, name: 'Trent',            symbol: 'TRENT',      price: 5623.40, change: 7.12, volume: '1.8Cr'  },
    { rank: 2, name: 'Persistent Sys',   symbol: 'PERSISTENT', price: 4892.15, change: 5.45, volume: '0.9Cr'  },
    { rank: 3, name: 'Max Healthcare',   symbol: 'MAXHEALTH',  price: 934.70,  change: 4.82, volume: '2.3Cr'  },
    { rank: 4, name: 'Indian Hotels',    symbol: 'INDHOTEL',   price: 678.90,  change: 4.11, volume: '3.5Cr'  },
    { rank: 5, name: 'Godrej Consumer',  symbol: 'GODREJCP',   price: 1234.50, change: 3.56, volume: '1.4Cr'  },
  ],
  small: [
    { rank: 1, name: 'IRFC',             symbol: 'IRFC',       price: 162.35, change: 8.45, volume: '22.1Cr' },
    { rank: 2, name: 'NHPC',             symbol: 'NHPC',       price: 89.70,  change: 6.78, volume: '31.5Cr' },
    { rank: 3, name: 'RailTel',          symbol: 'RAILTEL',    price: 345.10, change: 5.92, volume: '4.6Cr'  },
    { rank: 4, name: 'HUDCO',            symbol: 'HUDCO',      price: 234.80, change: 5.15, volume: '8.9Cr'  },
    { rank: 5, name: 'BEL',              symbol: 'BEL',        price: 278.45, change: 4.67, volume: '12.3Cr' },
  ],
};

const MOCK_LOSERS = {
  large: [
    { rank: 1, name: 'Reliance Ind',     symbol: 'RELIANCE',   price: 1348.10,change: -4.69, volume: '23.2Cr' },
    { rank: 2, name: 'HDFC Bank',        symbol: 'HDFCBANK',   price: 756.20, change: -3.11, volume: '14.5Cr' },
    { rank: 3, name: 'Adani Enterprise', symbol: 'ADANIENT',   price: 2345.60,change: -2.87, volume: '6.8Cr'  },
    { rank: 4, name: 'TCS',              symbol: 'TCS',        price: 2389.80,change: -2.34, volume: '5.1Cr'  },
    { rank: 5, name: 'Maruti Suzuki',    symbol: 'MARUTI',     price: 12456.30,change:-1.98, volume: '1.2Cr'  },
    { rank: 6, name: 'ICICI Bank',       symbol: 'ICICIBANK',  price: 1278.90,change: -1.56, volume: '9.7Cr'  },
    { rank: 7, name: 'Kotak Bank',       symbol: 'KOTAKBANK',  price: 1823.40,change: -1.23, volume: '3.4Cr'  },
    { rank: 8, name: 'Axis Bank',        symbol: 'AXISBANK',   price: 1156.70,change: -0.98, volume: '7.2Cr'  },
  ],
  mid: [
    { rank: 1, name: 'Zomato',           symbol: 'ZOMATO',     price: 234.50, change: -5.23, volume: '18.9Cr' },
    { rank: 2, name: 'PB Fintech',       symbol: 'POLICYBZR',  price: 1567.80,change: -4.12, volume: '2.1Cr'  },
    { rank: 3, name: 'Delhivery',        symbol: 'DELHIVERY',  price: 423.40, change: -3.78, volume: '3.4Cr'  },
    { rank: 4, name: 'AU Small Fin',     symbol: 'AUBANK',     price: 612.30, change: -2.89, volume: '4.7Cr'  },
    { rank: 5, name: 'IDFC First Bank',  symbol: 'IDFCFIRSTB', price: 78.90,  change: -2.45, volume: '25.6Cr' },
  ],
  small: [
    { rank: 1, name: 'Paytm',            symbol: 'PAYTM',      price: 456.70, change: -6.89, volume: '12.3Cr' },
    { rank: 2, name: 'Vodafone Idea',    symbol: 'IDEA',       price: 12.35,  change: -5.67, volume: '89.4Cr' },
    { rank: 3, name: 'Yes Bank',         symbol: 'YESBANK',    price: 21.45,  change: -4.23, volume: '56.7Cr' },
    { rank: 4, name: 'Suzlon Energy',    symbol: 'SUZLON',     price: 52.30,  change: -3.56, volume: '34.2Cr' },
    { rank: 5, name: 'JP Power',         symbol: 'JPPOWER',    price: 18.90,  change: -2.89, volume: '28.1Cr' },
  ],
};

const CAP_TABS = ['Large Cap', 'Mid Cap', 'Small Cap'];
const CAP_KEYS = ['large', 'mid', 'small'];

function StockTable({ rows, navigate }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>Stock</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>Price (₹)</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>Change %</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>Volume</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => {
            const positive = row.change >= 0;
            return (
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
                  transition: 'background-color 0.15s',
                }}
              >
                <TableCell sx={{ fontWeight: 600, opacity: 0.5, width: 40 }}>
                  {row.rank}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    {row.symbol}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                    ₹{row.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    icon={
                      positive ? (
                        <ArrowDropUpIcon sx={{ fontSize: 16, color: '#26A65B !important' }} />
                      ) : (
                        <ArrowDropDownIcon sx={{ fontSize: 16, color: '#E74C3C !important' }} />
                      )
                    }
                    label={`${positive ? '+' : ''}${row.change.toFixed(2)}%`}
                    sx={{
                      bgcolor: positive
                        ? 'rgba(38,166,91,0.12)'
                        : 'rgba(231,76,60,0.12)',
                      color: positive ? '#26A65B' : '#E74C3C',
                      fontWeight: 700,
                      borderRadius: 999,
                      height: 24,
                      fontSize: 12,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.7 }}>
                    {row.volume}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function GainersLosers({ gainersData, losersData }) {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState(0);
  const [capTab, setCapTab] = useState(0);

  const gainers = gainersData || MOCK_GAINERS;
  const losers = losersData || MOCK_LOSERS;

  const source = mainTab === 0 ? gainers : losers;
  const rows = source[CAP_KEYS[capTab]] || [];

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease 0.2s', animationFillMode: 'both' }}>
      <Typography className="section-title">
        {mainTab === 0 ? 'Top Gainers' : 'Top Losers'}
      </Typography>
      <Paper
        elevation={0}
        className="glass-card"
        sx={{
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.03)'
              : '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            flexWrap: 'wrap',
          }}
        >
          <Tabs
            value={mainTab}
            onChange={(_, v) => setMainTab(v)}
            textColor="inherit"
            TabIndicatorProps={{
              style: { backgroundColor: mainTab === 0 ? '#26A65B' : '#E74C3C', height: 3 },
            }}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
            }}
          >
            <Tab label="🚀 Top Gainers" />
            <Tab label="📉 Top Losers" />
          </Tabs>

          <Tabs
            value={capTab}
            onChange={(_, v) => setCapTab(v)}
            textColor="inherit"
            TabIndicatorProps={{ style: { backgroundColor: '#5C6BC0', height: 2 } }}
            sx={{
              mr: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.78rem',
                minWidth: 'auto',
                px: 1.5,
                minHeight: 40,
              },
            }}
          >
            {CAP_TABS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </Box>

        <StockTable rows={rows} navigate={navigate} />
      </Paper>
    </Box>
  );
}

export default GainersLosers;
