import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Snackbar, Alert, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Navbar from './Navbar';
import StockList from './StockList';
import StockDetail from './StockDetail';
import {
  STOCKS,
  fetchStocksChunk,
  fetchStockChart,
  fetchNifty
} from '../services/stockService';
import { getMarketStatus } from '../utils/marketUtils';

const FAVORITES_KEY = 'nse-dashboard-favorites';
const REFRESH_INTERVAL =
  Number(import.meta.env.VITE_REFRESH_INTERVAL) || 300000;

function loadFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveFavoritesToStorage(favs) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch {
    // ignore
  }
}

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [sparklineMap, setSparklineMap] = useState({});
  const [nifty, setNifty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('area');
  const [timeRange, setTimeRange] = useState('1M');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    setFavorites(loadFavoritesFromStorage());
  }, []);

  const quoteTimersRef = useRef([]);

  const clearQuoteTimers = useCallback(() => {
    quoteTimersRef.current.forEach((t) => clearTimeout(t));
    quoteTimersRef.current = [];
  }, []);

  const sparklineTimersRef = useRef([]);

  const clearSparklineTimers = useCallback(() => {
    sparklineTimersRef.current.forEach((t) => clearTimeout(t));
    sparklineTimersRef.current = [];
  }, []);

  const queueSparklineFetches = useCallback(
    (stockList) => {
      clearSparklineTimers();

      // Twelve Data free tiers are often limited to ~8 credits/minute.
      // We already spend 2 credits on (batch quotes + nifty),
      // so we stagger sparklines to avoid 429 rate limits.
      const DELAY_MS = 11000; // ~5-6 requests per minute

      (stockList || []).forEach((stock, idx) => {
        const symbol = stock.symbol;
        const already = sparklineMap?.[symbol];
        if (Array.isArray(already) && already.length > 0) return;

        const timer = setTimeout(async () => {
          try {
            const data = await fetchStockChart(symbol, '1M');
            const closes =
              data && data.length > 0 ? data.slice(-7).map((d) => d.close) : [];
            setSparklineMap((prev) => ({ ...prev, [symbol]: closes }));
          } catch (e) {
            // Leave placeholder on failure
          }
        }, idx * DELAY_MS);

        sparklineTimersRef.current.push(timer);
      });
    },
    [clearSparklineTimers, sparklineMap]
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // With limited Twelve Data credits/minute, we must fetch quotes in chunks.
      const niftyRes = await fetchNifty();
      setNifty(niftyRes);

      clearQuoteTimers();
      setStocks([]);

      const chunkSize = 4; // 4 credits per request
      const delayMs = 30000; // 2 chunks/minute => 8 credits/min (plus Nifty call)
      const symbols = STOCKS.map((s) => s.symbol);

      const firstSymbols = symbols.slice(0, chunkSize);
      let firstChunk = [];
      try {
        firstChunk = await fetchStocksChunk(firstSymbols);
        setStocks(firstChunk);
      } catch (e) {
        if (e && (e.code === 429 || String(e.message || '').includes('credits'))) {
          const msg = String(e.message || '');
          const daily = msg.toLowerCase().includes('for the day') || msg.toLowerCase().includes('daily');
          setError(
            daily
              ? 'Twelve Data daily API credit limit reached (HTTP 429). This key cannot fetch more data today. Try again tomorrow or use a higher-tier API key.'
              : 'Twelve Data rate limit reached (HTTP 429). Wait ~60 seconds and press Refresh. Consider upgrading your Twelve Data plan for faster updates.'
          );
        } else {
          setError('Failed to load stock quotes. Check your API key and try again.');
        }
      }

      if ((!selectedStock || !firstChunk.find((s) => s.symbol === selectedStock.symbol)) && firstChunk.length > 0) {
        setSelectedStock(firstChunk[0]);
      }

      // Queue remaining chunks progressively (so we stay under credit limits).
      for (let i = chunkSize; i < symbols.length; i += chunkSize) {
        const chunkSymbols = symbols.slice(i, i + chunkSize);
        const timer = setTimeout(async () => {
          try {
            const chunk = await fetchStocksChunk(chunkSymbols);
            setStocks((prev) => {
              const bySymbol = new Map((prev || []).map((s) => [s.symbol, s]));
              chunk.forEach((s) => bySymbol.set(s.symbol, s));
              const merged = Array.from(bySymbol.values());
              // Keep list order as STOCKS
              merged.sort(
                (a, b) =>
                  symbols.indexOf(a.symbol) - symbols.indexOf(b.symbol)
              );
              return merged;
            });
          } catch (e) {
            // If we hit 429 mid-queue, just stop; user can refresh later.
            if (e && e.code === 429) {
              const msg = String(e.message || '');
              const daily = msg.toLowerCase().includes('for the day') || msg.toLowerCase().includes('daily');
              setError(
                daily
                  ? 'Twelve Data daily API credit limit reached (HTTP 429). Remaining stocks cannot load today. Try again tomorrow or use a higher-tier API key.'
                  : 'Twelve Data rate limit reached while loading remaining stocks. Wait ~60 seconds and press Refresh.'
              );
              clearQuoteTimers();
            }
          }
        }, (i / chunkSize) * delayMs);
        quoteTimersRef.current.push(timer);
      }

      // Sparkline data is loaded progressively to avoid rate limiting.
      queueSparklineFetches(firstChunk || []);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('loadAllData error', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clearQuoteTimers, queueSparklineFetches, selectedStock]);

  useEffect(() => {
    loadAllData();
    const id = setInterval(() => {
      loadAllData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [loadAllData]);

  useEffect(() => {
    return () => {
      clearSparklineTimers();
      clearQuoteTimers();
    };
  }, [clearQuoteTimers, clearSparklineTimers]);

  const loadChartForStock = useCallback(async (stockSymbol, range) => {
    if (!stockSymbol) return;
    setChartLoading(true);
    try {
      const data = await fetchStockChart(stockSymbol, range);
      setChartData(data || []);
    } catch (err) {
      console.error('loadChartForStock error', err);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStock) {
      loadChartForStock(selectedStock.symbol, timeRange);
    } else {
      setChartData([]);
    }
  }, [selectedStock, timeRange, loadChartForStock]);

  const handleToggleFavorite = useCallback((symbol) => {
    setFavorites((prev) => {
      const exists = prev.includes(symbol);
      let next;
      if (exists) {
        next = prev.filter((s) => s !== symbol);
      } else {
        next = [...prev, symbol];
      }
      saveFavoritesToStorage(next);
      setSnackbar({
        open: true,
        message: exists ? 'Removed from favorites' : 'Added to favorites ❤️',
        severity: 'success'
      });
      return next;
    });
  }, []);

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const marketStatus = getMarketStatus();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0A0A0F'
      }}
    >
      <Navbar
        nifty={nifty}
        marketStatus={marketStatus}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          p: 2
        }}
      >
        {isMobile ? (
          <>
            <StockList
              stocks={stocks}
              selectedStock={selectedStock}
              favorites={favorites}
              loading={loading}
              onSelectStock={setSelectedStock}
              onToggleFavorite={handleToggleFavorite}
              sparklineMap={sparklineMap}
            />
            <StockDetail
              stock={selectedStock}
              chartData={chartData}
              chartLoading={chartLoading}
              chartType={chartType}
              timeRange={timeRange}
              onChartTypeChange={setChartType}
              onTimeRangeChange={setTimeRange}
            />
          </>
        ) : (
          <>
            <StockDetail
              stock={selectedStock}
              chartData={chartData}
              chartLoading={chartLoading}
              chartType={chartType}
              timeRange={timeRange}
              onChartTypeChange={setChartType}
              onTimeRangeChange={setTimeRange}
            />
            <StockList
              stocks={stocks}
              selectedStock={selectedStock}
              favorites={favorites}
              loading={loading}
              onSelectStock={setSelectedStock}
              onToggleFavorite={handleToggleFavorite}
              sparklineMap={sparklineMap}
            />
          </>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ bgcolor: '#1E1E1E' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            maxWidth: 320
          }}
        >
          <Alert
            severity="error"
            variant="filled"
            sx={{ bgcolor: '#B71C1C' }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;

