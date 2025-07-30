import React from 'react';
import { Box, TextField, IconButton, Button, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useApiCall } from '../ApiCallContext';

export const HeadersEditor: React.FC = () => {
  const { headers, setHeaders } = useApiCall();

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Request Headers
      </Typography>
      {headers.map((header, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            label="Key"
            value={header.key}
            onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Value"
            value={header.value}
            onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
            sx={{ flex: 2 }}
          />
          <IconButton 
            color="error" 
            onClick={() => handleRemoveHeader(index)}
            disabled={headers.length === 1}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Button 
        startIcon={<AddIcon />} 
        onClick={handleAddHeader} 
        sx={{ mt: 1 }}
        size="small"
      >
        Add Header
      </Button>
    </Box>
  );
};