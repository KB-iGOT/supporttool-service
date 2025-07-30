import React from 'react';
import { Box, Paper, Typography, IconButton, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { JsonEditor } from '../../common-components/json-editor/json-editor';
import { useApiCall } from '../ApiCallContext';
import { formatJSON, isJsonResponse } from '../utils/requestHandler';

export const ResponseViewer: React.FC = () => {
  const { response, error, showNotification } = useApiCall();

  const copyToClipboard = () => {
    if (!response) return;
    
    navigator.clipboard.writeText(formatJSON(response.data))
      .then(() => {
        showNotification('Response copied to clipboard');
      })
      .catch(() => {
        showNotification('Failed to copy to clipboard');
      });
  };

  const downloadResponse = () => {
    if (!response) return;
    
    const blob = new Blob([formatJSON(response.data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!response) {
    return (
      <Typography variant="body2" color="text.secondary">
        No response data available. Execute a request to see results.
      </Typography>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" component="span">
            Status: 
          </Typography>
          <Typography 
            component="span" 
            sx={{ 
              ml: 1, 
              color: response.status < 300 ? 'success.main' : 
                     response.status < 400 ? 'info.main' : 
                     response.status < 500 ? 'warning.main' : 'error.main',
              fontWeight: 'bold'
            }}
          >
            {response.status} {response.statusText}
          </Typography>
        </Box>
        <Typography variant="body2">
          Time: {response.time} ms
        </Typography>
      </Box>
      
      <Typography variant="subtitle2" gutterBottom>
        Response Headers
      </Typography>
      <Paper variant="outlined" sx={{ p: 1, mb: 2, maxHeight: 150, overflow: 'auto' }}>
        {Object.entries(response.headers).map(([key, value]) => (
          <Typography key={key} variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
            <strong>{key}:</strong> {value}
          </Typography>
        ))}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          Response Body
        </Typography>
        <Box>
          <IconButton size="small" onClick={copyToClipboard} title="Copy to clipboard">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={downloadResponse} title="Download as JSON">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {isJsonResponse(response) ? (
        <Box sx={{ height: 400, border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: 1 }}>
          <JsonEditor 
            input={formatJSON(response.data)} 
            onChange={() => {}} // Adding dummy onChange handler for readOnly editor
            customOptions={{ readOnly: true }}
          />
        </Box>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 1, 
            maxHeight: 400, 
            overflow: 'auto', 
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {formatJSON(response.data)}
        </Paper>
      )}
    </Box>
  );
};