import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Chip, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NEWS_DATA, { SOURCE_COLORS, NEWS_TABS } from '../data/newsData';
import { getMarketStatus } from '../utils/marketUtils';

function NewsItem({ item, onStockClick }) {
  const positive = item.changePercent >= 0;
  const borderColor = positive ? '#26A65B' : '#E74C3C';
  const chipColor = positive ? '#26A65B' : '#E74C3C';
  const chipBg = positive ? 'rgba(38,166,91,0.12)' : 'rgba(231,76,60,0.12)';
  const src = SOURCE_COLORS[item.source] || { bg: 'rgba(92,107,192,0.12)', color: '#5C6BC0' };

  return (
    <Box
      component="a"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: 'flex', gap: 2, py: 2, textDecoration: 'none', color: 'inherit',
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        '&:last-child': { borderBottom: 'none' },
        '&:hover .news-headline': { color: '#5C6BC0' },
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(92,107,192,0.04)' : 'rgba(92,107,192,0.02)' },
      }}
    >
      {/* Timeline bar */}
      <Box sx={{ width: 4, borderRadius: 999, backgroundColor: borderColor, flexShrink: 0, alignSelf: 'stretch' }} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Source & time */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Chip
            label={item.source}
            size="small"
            sx={{
              height: 20, fontSize: 10, fontWeight: 700, borderRadius: 999,
              bgcolor: src.bg, color: src.color,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
          <Typography variant="caption" sx={{ opacity: 0.45 }}>
            {item.time}
          </Typography>
        </Box>

        {/* Headline (max 2 lines) */}
        <Typography className="news-headline" variant="body2" sx={{
          fontWeight: 500, lineHeight: 1.5, transition: 'color 0.15s',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.headline}
        </Typography>

        {/* Stock chip */}
        <Chip
          clickable
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStockClick && onStockClick(item.relatedStock); }}
          label={`${item.relatedStock}  ${positive ? '▲' : '▼'} ${positive ? '+' : ''}${item.changePercent.toFixed(2)}%`}
          size="small"
          sx={{
            mt: 0.75, height: 22, fontSize: 11, fontWeight: 700,
            bgcolor: chipBg, color: chipColor, borderRadius: 999,
            cursor: 'pointer', transition: 'transform 0.15s',
            '&:hover': { transform: 'scale(1.05)' },
          }}
        />
      </Box>
    </Box>
  );
}

function NewsFeed() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const marketStatus = getMarketStatus();

  const filtered = useMemo(() => {
    const key = NEWS_TABS[activeTab]?.key || 'all';
    if (key === 'all') return NEWS_DATA;
    return NEWS_DATA.filter((n) => n.sector === key || n.sector === 'all');
  }, [activeTab]);

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease 0.35s', animationFillMode: 'both' }}>
      {/* Header with live dot */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography className="section-title" sx={{ mb: '0 !important' }}>
          Market News
        </Typography>
        <Box sx={{
          width: 8, height: 8, borderRadius: '50%',
          bgcolor: marketStatus?.isOpen ? '#26A65B' : '#E74C3C',
          animation: marketStatus?.isOpen ? 'livePulse 1.5s infinite' : 'none',
        }} />
      </Box>

      <Paper
        elevation={0}
        className="glass-card"
        sx={{
          borderRadius: 3, overflow: 'hidden',
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
        }}
      >
        {/* Sector tabs */}
        <Box sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            textColor="inherit"
            TabIndicatorProps={{ style: { backgroundColor: '#5C6BC0', height: 3, borderRadius: 999 } }}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', minWidth: 'auto', px: 2 },
            }}
          >
            {NEWS_TABS.map((t) => <Tab key={t.label} label={t.label} />)}
          </Tabs>
        </Box>

        {/* News items */}
        <Box sx={{ px: 2.5, py: 0.5 }}>
          {filtered.map((item) => (
            <NewsItem key={item.id} item={item} onStockClick={(sym) => navigate(`/stock/${sym}`)} />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

export default NewsFeed;
