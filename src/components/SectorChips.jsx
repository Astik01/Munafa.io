import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';

const SECTORS = [
  { label: 'Banking',  emoji: '🏦' },
  { label: 'IT',       emoji: '💻' },
  { label: 'Energy',   emoji: '⚡' },
  { label: 'Auto',     emoji: '🚗' },
  { label: 'Pharma',   emoji: '💊' },
  { label: 'Infra',    emoji: '🏗️' },
  { label: 'Consumer', emoji: '🛒' },
  { label: 'Finance',  emoji: '💰' },
  { label: 'Metals',   emoji: '⛏️' },
  { label: 'Realty',   emoji: '🏠' },
];

function SectorChips({ activeSector, onSectorChange }) {
  const [selected, setSelected] = useState(activeSector || null);

  const handleClick = (label) => {
    const next = selected === label ? null : label;
    setSelected(next);
    onSectorChange && onSectorChange(next);
  };

  return (
    <Box sx={{ animation: 'slideUp 0.4s ease 0.15s', animationFillMode: 'both' }}>
      <Typography className="section-title">Explore Sectors</Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {SECTORS.map((sec) => {
          const isActive = selected === sec.label;
          return (
            <Chip
              key={sec.label}
              label={`${sec.emoji} ${sec.label}`}
              clickable
              onClick={() => handleClick(sec.label)}
              sx={{
                borderRadius: 999,
                px: 1,
                py: 2.2,
                fontSize: '0.85rem',
                fontWeight: 600,
                border: (t) =>
                  isActive
                    ? '1px solid #5C6BC0'
                    : `1px solid ${t.palette.divider}`,
                bgcolor: (t) =>
                  isActive
                    ? t.palette.mode === 'dark'
                      ? 'rgba(92,107,192,0.18)'
                      : 'rgba(92,107,192,0.1)'
                    : 'transparent',
                color: isActive ? '#5C6BC0' : 'inherit',
                boxShadow: isActive
                  ? '0 2px 12px rgba(92,107,192,0.25)'
                  : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: (t) =>
                    t.palette.mode === 'dark'
                      ? 'rgba(92,107,192,0.12)'
                      : 'rgba(92,107,192,0.06)',
                  boxShadow: '0 2px 8px rgba(92,107,192,0.18)',
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export default SectorChips;
