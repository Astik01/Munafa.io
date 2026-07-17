import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Chip, Grid, IconButton, Skeleton, Button,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Navbar from './Navbar';
import { fetchStocksChunk } from '../services/stockService';
import { formatINR, formatChange } from '../utils/formatters';
import { getWatchlist, removeFromWatchlist, WATCHLIST_EVENT } from '../utils/watchlist';

function Watchlist() {
  const navigate = useNavigate();
  const [symbols, setSymbols] = useState(getWatchlist);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stay in sync with StockDetail toggles / other tabs
  useEffect(() => {
    const sync = () => setSymbols(getWatchlist());
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (symbols.length === 0) {
        setQuotes([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const arr = await fetchStocksChunk(symbols.map((s) => s.symbol));
        if (!cancelled) setQuotes(arr);
      } catch (e) {
        console.error(e);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symbols]);

  const handleRemove = (symbol) => {
    removeFromWatchlist(symbol);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Watchlist</Typography>

        {symbols.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h6" gutterBottom>Your watchlist is empty</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6, mb: 3 }}>
              Add stocks from any stock detail page to track them here.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>Browse Stocks</Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {symbols.map((s) => {
              const quote = quotes.find((q) => q.symbol === s.symbol);
              const positive = quote?.changePercent >= 0;
              const color = positive ? '#26A65B' : '#E74C3C';

              return (
                <Grid item xs={12} sm={6} md={4} key={s.symbol}>
                  <Paper
                    elevation={0}
                    className="glass-card"
                    onClick={() => navigate(`/stock/${s.symbol}`)}
                    sx={{
                      p: 2.5, borderRadius: 3, cursor: 'pointer',
                      border: (t) => `1px solid ${t.palette.divider}`,
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{s.symbol}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>{s.name}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleRemove(s.symbol); }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      {loading && !quote ? (
                        <Skeleton width="60%" height={32} />
                      ) : quote ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatINR(quote.price)}</Typography>
                          <Chip
                            size="small"
                            icon={positive ? <ArrowDropUpIcon sx={{ color: `${color} !important` }} /> : <ArrowDropDownIcon sx={{ color: `${color} !important` }} />}
                            label={formatChange(quote.changePercent)}
                            sx={{ bgcolor: positive ? 'rgba(38,166,91,0.12)' : 'rgba(231,76,60,0.12)', color, fontWeight: 700 }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>Data unavailable</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default Watchlist;