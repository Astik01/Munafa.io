import React, { useState, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StockRow from './StockRow';

const SECTORS = [
  'All',
  'IT',
  'Banking',
  'Energy',
  'Auto',
  'Pharma',
  'Finance',
  'Infra',
  'Consumer'
];

const SORT_OPTIONS = [
  { value: 'marketCap', label: 'Market Cap' },
  { value: 'price', label: 'Price' },
  { value: 'changePercent', label: '% Change' },
  { value: 'volume', label: 'Volume' }
];

function StockList({
  stocks,
  selectedStock,
  favorites,
  loading,
  onSelectStock,
  onToggleFavorite,
  sparklineMap
}) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');
  const [sector, setSector] = useState('All');

  const favoriteSet = useMemo(
    () => new Set(favorites || []),
    [favorites]
  );

  const filteredStocks = useMemo(() => {
    if (!stocks || stocks.length === 0) return [];

    let arr = [...stocks];

    if (tab === 'favorites') {
      arr = arr.filter((s) => favoriteSet.has(s.symbol));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.symbol.toLowerCase().includes(q)
      );
    }

    if (sector !== 'All') {
      arr = arr.filter((s) => s.sector === sector);
    }

    arr.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (b.price || 0) - (a.price || 0);
        case 'changePercent':
          return (b.changePercent || 0) - (a.changePercent || 0);
        case 'volume':
          return (b.volume || 0) - (a.volume || 0);
        case 'marketCap':
        default:
          // Approximate market cap using price * volume
          const mA = (a.price || 0) * (a.volume || 0);
          const mB = (b.price || 0) * (b.volume || 0);
          return mB - mA;
      }
    });

    return arr;
  }, [stocks, tab, favoriteSet, search, sector, sortBy]);

  return (
    <Box
      sx={{
        flex: 4,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#00C853' } }}
        >
          <Tab
            value="all"
            label="All Stocks"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            value="favorites"
            label={`❤️ Favorites (${favorites?.length || 0})`}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Stack spacing={1.5}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or symbol"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.6)' }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.03)'
              }
            }}
          />

          <Stack direction="row" spacing={1.5}>
            <FormControl
              size="small"
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.03)'
                }
              }}
            >
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 0.75,
              pt: 0.5,
              pb: 0.5
            }}
          >
            {SECTORS.map((sec) => (
              <Chip
                key={sec}
                label={sec}
                clickable
                onClick={() => setSector(sec)}
                size="small"
                sx={{
                  flexShrink: 0,
                  borderRadius: 999,
                  bgcolor:
                    sector === sec
                      ? 'rgba(0,200,83,0.18)'
                      : 'rgba(255,255,255,0.05)',
                  color:
                    sector === sec
                      ? '#00C853'
                      : 'rgba(255,255,255,0.8)',
                  border:
                    sector === sec
                      ? '1px solid rgba(0,200,83,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 1
        }}
      >
        {loading ? (
          <Stack spacing={1}>
            {Array.from({ length: 6 }).map((_, i) => (
              <StockRow key={i} stock={null} />
            ))}
          </Stack>
        ) : filteredStocks.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            <Typography variant="body2">
              No stocks match your search
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {filteredStocks.map((stock) => (
              <StockRow
                key={stock.symbol}
                stock={stock}
                isSelected={selectedStock?.symbol === stock.symbol}
                isFavorite={favoriteSet.has(stock.symbol)}
                onSelect={onSelectStock}
                onToggleFavorite={onToggleFavorite}
                sparklineData={sparklineMap?.[stock.symbol] || []}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default StockList;

