import React, { useState } from 'react';
import { Autocomplete, TextField, InputAdornment, Box, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { STOCKS } from '../services/stockService';

function GlobalSearch() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  const handleSelect = (event, value) => {
    if (value?.symbol) {
      navigate(`/stock/${value.symbol}`);
      setInputValue('');
    }
  };

  return (
    <Autocomplete
      options={STOCKS}
      getOptionLabel={(option) => option.symbol || ''}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      onChange={handleSelect}
      filterOptions={(options, { inputValue: q }) => {
        if (!q.trim()) return [];
        const lower = q.toLowerCase();
        return options
          .filter((o) => o.symbol.toLowerCase().includes(lower) || o.name.toLowerCase().includes(lower))
          .slice(0, 8);
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.symbol} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.symbol}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>{option.name}</Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search stocks…"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ opacity: 0.5, fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />
      )}
      sx={{
        width: 220,
        display: { xs: 'none', sm: 'block' },
        '& .MuiOutlinedInput-root': {
          borderRadius: 999,
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
        },
      }}
      noOptionsText="No stocks found"
    />
  );
}

export default GlobalSearch;