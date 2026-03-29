import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Tooltip, Tab, Tabs, Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeToggle } from '../App';
import { fetchNifty } from '../services/stockService';
import GlobeWidget from './GlobeWidget';
import { getMarketStatus } from '../utils/marketUtils';

function formatTime(date) {
  if (!date) return '--:--';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

const NAV_TABS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Indices',   path: '/index/nifty50' },
  { label: 'Watchlist',  path: '/' },
  { label: 'News',      path: '/' },
];

function Navbar({ lastUpdated, onRefresh, refreshing }) {
  const { mode, toggle } = useThemeToggle();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = mode === 'dark';
  const marketStatus = getMarketStatus();
  const showGlobe = true;

  // Live Nifty chip
  const [nifty, setNifty] = useState(null);

  const loadNifty = useCallback(async () => {
    try {
      const data = await fetchNifty();
      if (data) setNifty(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadNifty();
    const id = setInterval(loadNifty, 30000);
    return () => clearInterval(id);
  }, [loadNifty]);

  // Determine active tab from URL
  const activeTab = (() => {
    if (location.pathname.startsWith('/index')) return 1;
    if (location.pathname === '/') return 0;
    return 0;
  })();

  const niftyPositive = nifty && nifty.changePercent >= 0;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: isDark ? 'rgba(10,15,30,0.88)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        color: isDark ? '#F0F0F5' : '#1A1A2E',
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1.5, md: 3 }, minHeight: { xs: 56 } }}>
        {/* Brand */}
        <Box
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, cursor: 'pointer' }}
        >
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #5C6BC0 0%, #7C4DFF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16, color: '#fff',
          }}>M</Box>
          <Typography variant="h6" sx={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: '1.1rem', display: { xs: 'none', sm: 'block' },
          }}>munafa.io</Typography>
        </Box>

        {/* Globe */}
        {showGlobe && <GlobeWidget />}
        {/* Nav Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => navigate(NAV_TABS[v].path)}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#5C6BC0', height: 3, borderRadius: 999 } }}
          sx={{
            flex: 1, maxWidth: 420, mx: 'auto',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', minWidth: 'auto', px: 1.5 },
          }}
        >
          {NAV_TABS.map((t) => <Tab key={t.label} label={t.label} />)}
        </Tabs>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Market status badge */}
          <Chip
            size="small"
            label={marketStatus?.label || 'Loading'}
            sx={{
              height: 24, fontSize: 11, fontWeight: 700, borderRadius: 999,
              bgcolor: marketStatus?.isOpen ? 'rgba(38,166,91,0.15)' : 'rgba(231,76,60,0.12)',
              color: marketStatus?.isOpen ? '#26A65B' : '#E74C3C',
              border: `1px solid ${marketStatus?.isOpen ? 'rgba(38,166,91,0.3)' : 'rgba(231,76,60,0.25)'}`,
              display: { xs: 'none', md: 'flex' },
              '& .MuiChip-label': { px: 1 },
            }}
            icon={
              <Box sx={{
                width: 7, height: 7, borderRadius: '50%', ml: 1,
                bgcolor: marketStatus?.isOpen ? '#26A65B' : '#E74C3C',
                animation: 'pulse 1.8s infinite ease-in-out',
              }} />
            }
          />

          {/* Nifty chip */}
          {nifty && (
            <Chip
              size="small"
              label={`NIFTY ${nifty.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}  ${niftyPositive ? '▲' : '▼'} ${Math.abs(nifty.changePercent).toFixed(2)}%`}
              onClick={() => navigate('/index/nifty50')}
              sx={{
                height: 26, fontSize: 11, fontWeight: 700, borderRadius: 999, cursor: 'pointer',
                bgcolor: niftyPositive ? 'rgba(38,166,91,0.12)' : 'rgba(231,76,60,0.12)',
                color: niftyPositive ? '#26A65B' : '#E74C3C',
                border: `1px solid ${niftyPositive ? 'rgba(38,166,91,0.25)' : 'rgba(231,76,60,0.2)'}`,
                display: { xs: 'none', sm: 'flex' },
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.04)' },
              }}
            />
          )}

          {/* Updated time */}
          <Box sx={{ textAlign: 'right', mr: 0.5, display: { xs: 'none', md: 'block' } }}>
            <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', lineHeight: 1.2 }}>Updated</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatTime(lastUpdated)}</Typography>
          </Box>

          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} size="small" sx={{
              color: 'inherit', '&:hover': { color: '#5C6BC0' },
              animation: refreshing ? 'spin 0.9s linear infinite' : 'none',
            }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={toggle} size="small" sx={{
              color: 'inherit', '&:hover': { color: '#5C6BC0' },
              transition: 'transform 0.3s', '&:active': { transform: 'rotate(180deg)' },
            }}>
              {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
