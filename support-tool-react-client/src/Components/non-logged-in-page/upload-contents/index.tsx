import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const UploadContents = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Upload Contents
        </Typography>
        <Typography variant="body1" paragraph>
          This page is under construction.
        </Typography>
        <Typography variant="body1">
          Please check back later for updates.
        </Typography>
      </Paper>
    </Box>
  );
};

export default UploadContents;