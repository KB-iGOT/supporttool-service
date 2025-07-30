import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import { useApiCall } from '../ApiCallContext';
import { parseCurlCommand, formatBodyData } from '../utils/curlParser';

export const CurlImport: React.FC = () => {
  const {
    curlCommand, setCurlCommand,
    setUrl, setMethod, setHeaders,
    setBodyContent, setBodyFormat, setActiveTab,
    showNotification
  } = useApiCall();

  const handleCurlCommandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurlCommand(event.target.value);
  };

  const handleParseCurl = () => {
    if (!curlCommand.trim()) return;
    
    const result = parseCurlCommand(curlCommand);
    
    if (result.error) {
      showNotification(result.error);
      return;
    }
    
    // Update state with parsed values
    if (result.url) setUrl(result.url);
    if (result.method) setMethod(result.method);
    if (result.headers.length > 0) setHeaders(result.headers);
    
    if (result.bodyData) {
      const { formattedData, detectedFormat } = formatBodyData(result.bodyData, result.bodyFormat);
      setBodyContent(formattedData);
      setBodyFormat(detectedFormat);
      setActiveTab('body');
    } else {
      // If no body data found
      setActiveTab('headers');
    }
    
    // Clear curl command input after successful parsing
    setCurlCommand('');
    showNotification('cURL command parsed successfully');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Import from cURL
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Paste cURL command"
          variant="outlined"
          value={curlCommand}
          onChange={handleCurlCommandChange}
          placeholder="Paste cURL command"
          multiline
          maxRows={3}
        />
        <Button 
          variant="outlined" 
          onClick={handleParseCurl}
          startIcon={<CodeIcon />}
          disabled={!curlCommand}
        >
          Parse
        </Button>
      </Box>
    </Box>
  );
};