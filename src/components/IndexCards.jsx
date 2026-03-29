import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { fetchIndexQuote } from '../services/stockService';
import { INDEX_META } from '../data/indexConstituents';

const INDEX_LIST = [
  { ...INDEX_META.nifty50,   routeId: 'nifty50' },
  { ...INDEX_META.sensex,    routeId: 'sensex' },
  { ...INDEX_META.banknifty, routeId: 'banknifty' },
  { ...INDEX_META.niftyit,   routeId: 'niftyit' },
  { ...INDEX_META.midcap100, routeId: 'midcap100' },
  { ...INDEX_META.finnifty,  routeId: 'finnifty' },
];

/* ── Skeleton card for loading / error states ──────────── */
function IndexCardSkeleton({ name }) {
  return (
    <Paper elevation={0} sx={{
      minWidth: 210, p: 2, borderRadius: 3, flexShrink: 0,
      border: (t) => `1px solid ${t.palette.divider}`,
      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
    }}>
      <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.5 }}>{name || ''}</Typography>
      <Skeleton width={130} height={28} sx={{ mt: 0.5 }} />
      <Skeleton width={110} height={18} sx={{ mt: 0.5 }} />
      <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 1, borderRadius: 1 }} />
    </Paper>
  );
}

/* ── 3D tilt + shine effect card ───────────────────────── */
function IndexCard({ index, data, onClick }) {
  const cardRef = useRef(null);
  const shineRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = Math.max(-10, Math.min(10, -(e.clientY - cy) / 10));
    const ry = Math.max(-10, Math.min(10, (e.clientX - cx) / 10));
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;

    if (shineRef.current) {
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      shineRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.18) 0%, transparent 60%)`;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
    if (shineRef.current) shineRef.current.style.background = 'transparent';
  }, []);

  if (!data) return <IndexCardSkeleton name={index.name} />;

  const positive = data.changePercent >= 0;
  const color = positive ? '#26A65B' : '#E74C3C';
  const points = (data.sparkline || []).map((v, i) => ({ i, v }));

  return (
    <Paper
      ref={cardRef}
      elevation={0}
      className="glass-card"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        minWidth: 210, p: 2, borderRadius: 3, flexShrink: 0, position: 'relative', overflow: 'hidden',
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
        transition: 'transform 0.1s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: (t) => t.palette.mode === 'dark'
            ? '0 12px 32px rgba(92,107,192,0.2)' : '0 12px 32px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Glossy shine overlay */}
      <Box ref={shineRef} sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
      }} />

      <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.6, letterSpacing: 0.5 }}>
        {index.name}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", mt: 0.25 }}>
        {data.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
        {positive ? <ArrowDropUpIcon sx={{ color, fontSize: 18 }} /> : <ArrowDropDownIcon sx={{ color, fontSize: 18 }} />}
        <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
          {Math.abs(data.change).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({positive ? '+' : ''}{data.changePercent.toFixed(2)}%)
        </Typography>
      </Box>
      {points.length > 1 && (
        <Box sx={{ mt: 1 }}>
          <ResponsiveContainer width="100%" height={36}>
            <LineChart data={points}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

/* ── Auto-scrolling carousel ───────────────────────────── */
function IndexCards() {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const [data, setData] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Use Promise.allSettled so each card loads independently
      const results = await Promise.allSettled(
        INDEX_LIST.map(async (idx) => {
          const quote = await fetchIndexQuote(idx.yahooSymbol);
          return { routeId: idx.routeId, quote };
        })
      );
      if (cancelled) return;
      const updates = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.quote) {
          updates[r.value.routeId] = r.value.quote;
        }
        // Failed fetches: updates[routeId] stays undefined → skeleton shown
      });
      setData(updates);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCardHover = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
  };
  const handleCardLeave = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
  };

  // Double the cards for seamless infinite scroll
  const cards = [...INDEX_LIST, ...INDEX_LIST];

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease' }}>
      <Typography className="section-title">Market Overview</Typography>
      <Box sx={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
        <Box
          ref={trackRef}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
          sx={{
            display: 'flex',
            gap: 2,
            width: 'max-content',
            animation: 'scrollX 30s linear infinite',
          }}
        >
          {cards.map((idx, i) => (
            <IndexCard
              key={`${idx.routeId}-${i}`}
              index={idx}
              data={data[idx.routeId]}
              onClick={() => navigate(`/index/${idx.routeId}`)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default IndexCards;
