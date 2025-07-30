import React from 'react';
import { Paper, Typography, Alert, Stack } from '@mui/material';

export const UsageGuide: React.FC = () => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Usage Guide
      </Typography>
      <Stack spacing={1}>
        <Typography variant="body2">
          <strong>Import from cURL:</strong> Paste a cURL command and click "Parse" to automatically configure your request.
        </Typography>
        <Typography variant="body2">
          <strong>Methods:</strong> Select the HTTP method for your request (GET, POST, PUT, DELETE, etc.)
        </Typography>
        <Typography variant="body2">
          <strong>URL:</strong> Enter the complete URL including protocol (https://)
        </Typography>
        <Typography variant="body2">
          <strong>Headers:</strong> Add any required headers (Authorization, Content-Type, etc.)
        </Typography>
        <Typography variant="body2">
          <strong>Body:</strong> For methods like POST and PUT, specify a request body in the appropriate format
        </Typography>
        <Typography variant="body2">
          <strong>Execute:</strong> Click "Execute" to send the request and view the response
        </Typography>
        <Alert severity="info" sx={{ mt: 1 }}>
          For cross-origin requests, the server must support CORS or you may encounter errors.
        </Alert>
      </Stack>
    </Paper>
  );
};