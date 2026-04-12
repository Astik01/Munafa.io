import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Snackbar, Alert, Typography } from '@mui/material';
import Navbar from './Navbar';
import IndexCards from './IndexCards';
import FIIDIIChart from './FIIDIIChart';
import MostActive from './MostActive';
import GainersLosers from './GainersLosers';
import FiftyTwoWeekHL from './FiftyTwoWeekHL';
import SectorChips from './SectorChips';
import MostValuable from './MostValuable';
import NewsFeed from './NewsFeed';
import { fetchAllStocks } from '../services/stockService';
import { getMarketStatus } from '../utils/marketUtils';

const REFRESH_INTERVAL = Number(import.meta.env.VITE_REFRESH_INTERVAL) || 300000;

function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const stocksRes = await fetchAllStocks();
      setStocks(stocksRes || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('loadAllData error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const id = setInterval(loadAllData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [loadAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    setSnackbar({ open: true, message: 'Data refreshed ✓', severity: 'success' });
  };

  const marketStatus = getMarketStatus();

  // Derive gainers/losers from loaded stocks
  const sortedByChange = [...stocks].filter((s) => s.price > 0);
  const gainers = [...sortedByChange].sort((a, b) => b.changePercent - a.changePercent).slice(0, 8);
  const losers = [...sortedByChange].sort((a, b) => a.changePercent - b.changePercent).slice(0, 8);

  const fmt = (s, i) => ({
    rank: i + 1, name: s.name, symbol: s.symbol, price: s.price, change: s.changePercent,
    volume: s.volume > 1e7 ? `${(s.volume / 1e7).toFixed(1)}Cr` : s.volume > 1e5 ? `${(s.volume / 1e5).toFixed(1)}L` : `${s.volume}`,
  });

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar lastUpdated={lastUpdated} onRefresh={handleRefresh} refreshing={refreshing} />

      <Container maxWidth="lg" sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Market status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, animation: 'fadeIn 0.3s ease' }}>
          <Box sx={{
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: marketStatus?.color || '#FFA726',
            animation: 'pulse 1.8s infinite ease-in-out',
            boxShadow: `0 0 12px ${marketStatus?.color || '#FFA726'}`,
          }} />
          <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.8 }}>
            {marketStatus?.label || 'Loading'}
          </Typography>
        </Box>

        <IndexCards />
        <FIIDIIChart />
        <MostActive />
        <GainersLosers
          gainersData={gainers.length > 0 ? { large: gainers.map(fmt), mid: [], small: [] } : null}
          losersData={losers.length > 0 ? { large: losers.map(fmt), mid: [], small: [] } : null}
        />
        <FiftyTwoWeekHL />
        <SectorChips />
        <MostValuable />
        <NewsFeed />
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={(_, r) => r !== 'clickaway' && setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Dashboard;
