import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  Tooltip
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Sparkline from './Sparkline';
import { formatINR, formatChange } from '../utils/formatters';

function getInitials(name) {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0] || '';
  return (parts[0][0] || '') + (parts[1][0] || '');
}

function StockRowSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.5,
        gap: 1.5
      }}
    >
      <Skeleton variant="rectangular" width={4} height={40} />
      <Skeleton variant="circular" width={36} height={36} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="60%" />
        <Skeleton width="40%" />
      </Box>
      <Skeleton variant="rectangular" width={80} height={32} />
      <Box sx={{ textAlign: 'right', minWidth: 90 }}>
        <Skeleton width="80%" />
      </Box>
      <Skeleton variant="rectangular" width={60} height={28} />
      <IconButton size="small" disabled>
        <Skeleton variant="circular" width={24} height={24} />
      </IconButton>
    </Box>
  );
}

function StockRow({
  stock,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  sparklineData
}) {
  if (!stock) {
    return <StockRowSkeleton />;
  }

  const positive = stock.changePercent > 0;

  return (
    <Box
      onClick={() => onSelect && onSelect(stock)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.5,
        gap: 1.5,
        cursor: 'pointer',
        position: 'relative',
        backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          backgroundColor: 'rgba(255,255,255,0.04)'
        },
        transition: 'all 0.2s ease',
        borderRadius: 1.5,
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: '999px',
          backgroundColor: stock.color
        }}
      />

      <Avatar
        sx={{
          bgcolor: stock.color,
          width: 36,
          height: 36,
          fontSize: 14,
          ml: 1
        }}
      >
        {getInitials(stock.name)}
      </Avatar>

      <Box sx={{ flex: 1, ml: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {stock.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
        >
          {stock.symbol}
        </Typography>
      </Box>

      <Box sx={{ mr: 1 }}>
        <Sparkline data={sparklineData || []} />
      </Box>

      <Box sx={{ textAlign: 'right', minWidth: 90, mr: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {formatINR(stock.price)}
        </Typography>
      </Box>

      <Chip
        size="small"
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {positive ? (
              <ArrowDropUpIcon sx={{ fontSize: 18 }} />
            ) : (
              <ArrowDropDownIcon sx={{ fontSize: 18 }} />
            )}
            <span>{formatChange(stock.changePercent)}</span>
          </Box>
        }
        sx={{
          minWidth: 80,
          justifyContent: 'center',
          bgcolor: positive
            ? 'rgba(0,200,83,0.16)'
            : 'rgba(255,82,82,0.16)',
          color: positive ? '#00C853' : '#FF5252',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.1)',
          fontWeight: 600
        }}
      />

      <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(stock.symbol);
          }}
          sx={{
            color: isFavorite ? '#FF5252' : 'rgba(255,255,255,0.6)',
            '&:hover': {
              color: '#FF5252'
            }
          }}
        >
          {isFavorite ? (
            <FavoriteIcon fontSize="small" />
          ) : (
            <FavoriteBorderIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default StockRow;

