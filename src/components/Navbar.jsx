import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formatINR, formatChange } from '../utils/formatters';

function formatTime(date) {
  if (!date) return '--:--';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function Navbar({
  nifty,
  marketStatus,
  lastUpdated,
  onRefresh,
  refreshing
}) {
  const positive = nifty?.changePercent > 0;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background:
          'linear-gradient(90deg, #0A0A0F 0%, #0F1A13 50%, #0A0A0F 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <span>📈</span> <span>NSE Dashboard</span>
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            maxWidth: 340
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            NIFTY 50
          </Typography>
          {nifty ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600 }}
              >
                {formatINR(nifty.price)}
              </Typography>
              <Chip
                size="small"
                label={`${positive ? '▲' : '▼'} ${formatChange(
                  nifty.changePercent
                )}`}
                sx={{
                  height: 22,
                  bgcolor: positive
                    ? 'rgba(0,200,83,0.16)'
                    : 'rgba(255,82,82,0.16)',
                  color: positive ? '#00C853' : '#FF5252',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontWeight: 600
                }}
              />
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Nifty data unavailable
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: marketStatus?.color || '#FFA726',
                animation: 'pulse 1.8s infinite ease-in-out',
                boxShadow: `0 0 12px ${
                  marketStatus?.color || '#FFA726'
                }`
              }}
            />
            <Typography variant="body2">
              {marketStatus?.label || 'Loading status'}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Last updated
            </Typography>
            <Typography variant="body2">
              {formatTime(lastUpdated)}
            </Typography>
          </Box>

          <Tooltip title="Refresh data">
            <IconButton
              onClick={onRefresh}
              sx={{
                color: '#ffffff',
                '&:hover': { color: '#00C853' },
                animation: refreshing ? 'spin 0.9s linear infinite' : 'none'
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

