import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SearchBarProps } from '../types';

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  placeholder,
  onSearchChange
}) => {
  return (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={onSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};