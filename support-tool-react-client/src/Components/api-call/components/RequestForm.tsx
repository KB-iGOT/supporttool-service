import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, Button, SelectChangeEvent } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useApiCall } from '../ApiCallContext';
import { HttpMethod } from '../utils/types';
import { sendApiRequest } from '../utils/requestHandler';

export const RequestForm: React.FC = () => {
  const {
    url, setUrl,
    method, setMethod,
    headers, activeTab, setActiveTab,
    bodyContent, bodyFormat,
    loading, setLoading,
    setResponse, setError, showNotification
  } = useApiCall();

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleMethodChange = (event: SelectChangeEvent<HttpMethod>) => {
    setMethod(event.target.value as HttpMethod);
    
    // Auto-switch to body tab for methods that typically have a body
    if (['POST', 'PUT', 'PATCH'].includes(event.target.value) && activeTab === 'headers') {
      setActiveTab('body');
    }
  };

  const handleSendRequest = async () => {
    if (!url.trim()) {
      showNotification('URL is required');
      return;
    }
    
    setError(null);
    setResponse(null);
    setLoading(true);
    
    try {
      const response = await sendApiRequest(url, method, headers, bodyContent, bodyFormat);
      setResponse(response);
      setActiveTab('response');
    } catch (err: any) {
      console.error('API call error:', err);
      
      // Handle different types of errors
      if (err.response) {
        // The server responded with an error status
        setResponse({
          status: err.response.status,
          statusText: err.response.statusText || 'Error',
          headers: err.response.headers || {},
          data: err.response.data || err.message,
          time: 0
        });
      } else {
        // Network error, timeout, etc.
        setError(err.message || 'An unknown error occurred');
      }
      
      setActiveTab('response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <FormControl size="small" sx={{ width: 120 }}>
        <InputLabel id="method-select-label">Method</InputLabel>
        <Select
          labelId="method-select-label"
          id="method-select"
          value={method}
          label="Method"
          onChange={handleMethodChange}
        >
          <MenuItem value="GET">GET</MenuItem>
          <MenuItem value="POST">POST</MenuItem>
          <MenuItem value="PUT">PUT</MenuItem>
          <MenuItem value="DELETE">DELETE</MenuItem>
          <MenuItem value="PATCH">PATCH</MenuItem>
          <MenuItem value="HEAD">HEAD</MenuItem>
          <MenuItem value="OPTIONS">OPTIONS</MenuItem>
        </Select>
      </FormControl>
      
      <TextField
        fullWidth
        size="small"
        label="URL"
        variant="outlined"
        value={url}
        onChange={handleUrlChange}
        placeholder="https://api.example.com/endpoint"
      />
      
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<PlayArrowIcon />}
        onClick={handleSendRequest}
        disabled={loading || !url}
      >
        Execute
      </Button>
    </Box>
  );
};