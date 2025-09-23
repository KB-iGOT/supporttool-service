import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { StatusFilterPillsProps } from '../types';

export const StatusFilterPills: React.FC<StatusFilterPillsProps> = ({
  selectedStatuses,
  onStatusFilterChange
}) => {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
        Filter by Status:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="Not Started"
          color={selectedStatuses.includes(0) ? "primary" : "default"}
          variant={selectedStatuses.includes(0) ? "filled" : "outlined"}
          onClick={() => onStatusFilterChange(0)}
          clickable
        />
        <Chip
          label="In Progress"
          color={selectedStatuses.includes(1) ? "warning" : "default"}
          variant={selectedStatuses.includes(1) ? "filled" : "outlined"}
          onClick={() => onStatusFilterChange(1)}
          clickable
        />
        <Chip
          label="Completed"
          color={selectedStatuses.includes(2) ? "success" : "default"}
          variant={selectedStatuses.includes(2) ? "filled" : "outlined"}
          onClick={() => onStatusFilterChange(2)}
          clickable
        />
      </Box>
    </Box>
  );
};