import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import StockDetail from './components/StockDetail';
import IndexStockList from './components/IndexStockList';

/* ── Theme context ──────────────────────────────────────── */

const ThemeToggleContext = createContext({ mode: 'dark', toggle: () => {} });
export const useThemeToggle = () => useContext(ThemeToggleContext);

const MODE_KEY = 'munafa-theme-mode';

function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY) || 'dark';
  } catch {
    return 'dark';
  }
}

/* ── Palette tokens ─────────────────────────────────────── */

const COMMON = {
  primary:   { main: '#5C6BC0' },
  success:   { main: '#26A65B' },
  error:     { main: '#E74C3C' },
  warning:   { main: '#F39C12' },
  info:      { main: '#5C6BC0' },
};

const darkPalette = {
  mode: 'dark',
  ...COMMON,
  background: { default: '#0A0F1E', paper: '#111827' },
  text: { primary: '#F0F0F5', secondary: 'rgba(240,240,245,0.65)' },
  divider: 'rgba(255,255,255,0.08)',
};

const lightPalette = {
  mode: 'light',
  ...COMMON,
  background: { default: '#F5F7FA', paper: '#FFFFFF' },
  text: { primary: '#1A1A2E', secondary: 'rgba(26,26,46,0.6)' },
  divider: 'rgba(0,0,0,0.08)',
};

function buildTheme(mode) {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  return createTheme({
    palette,
    typography: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
      h1: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h2: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h3: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h4: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    },
  });
}

/* ── Error boundary ─────────────────────────────────────── */

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
          <div><h2>Something went wrong.</h2><p>Please refresh the page.</p></div>
        </Box>
      );
    }
    return this.props.children;
  }
}

/* ── App ────────────────────────────────────────────────── */

function App() {
  const [mode, setMode] = useState(loadMode);

  useEffect(() => {
    try { localStorage.setItem(MODE_KEY, mode); } catch {}
  }, [mode]);

  const toggle = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const ctx = useMemo(() => ({ mode, toggle }), [mode]);

  return (
    <ThemeToggleContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock/:symbol" element={<StockDetail />} />
              <Route path="/index/:indexSymbol" element={<IndexStockList />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}

export default App;
