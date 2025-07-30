import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, SelectChangeEvent } from '@mui/material';
import { JsonEditor } from '../../common-components/json-editor/json-editor';
import { useApiCall } from '../ApiCallContext';
import { BodyFormat } from '../utils/types';

export const BodyEditor: React.FC = () => {
  const { bodyFormat, setBodyFormat, bodyContent, setBodyContent, headers, setHeaders } = useApiCall();

  const handleBodyFormatChange = (event: SelectChangeEvent) => {
    const newFormat = event.target.value as BodyFormat;
    setBodyFormat(newFormat);
    
    // Update content-type header based on body format
    const contentTypeIndex = headers.findIndex(h => h.key.toLowerCase() === 'content-type');
    if (contentTypeIndex !== -1) {
      const newHeaders = [...headers];
      if (newFormat === 'json') {
        newHeaders[contentTypeIndex].value = 'application/json';
      } else if (newFormat === 'x-www-form-urlencoded') {
        newHeaders[contentTypeIndex].value = 'application/x-www-form-urlencoded';
      } else if (newFormat === 'form-data') {
        newHeaders[contentTypeIndex].value = 'multipart/form-data';
      } else {
        newHeaders[contentTypeIndex].value = 'text/plain';
      }
      setHeaders(newHeaders);
    }
    
    // Set example content based on format
    if (newFormat === 'json') {
      setBodyContent('{\n  "key": "value"\n}');
    } else if (newFormat === 'x-www-form-urlencoded') {
      setBodyContent('key1=value1&key2=value2');
    } else if (newFormat === 'form-data') {
      setBodyContent('{\n  "field1": "value1",\n  "field2": "value2"\n}');
    } else {
      setBodyContent('Plain text content');
    }
  };

  const handleBodyContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBodyContent(event.target.value);
  };

  const handleJsonEditorChange = (json: string) => {
    setBodyContent(json);
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="body-format-label">Body Format</InputLabel>
        <Select
          labelId="body-format-label"
          id="body-format"
          value={bodyFormat}
          label="Body Format"
          onChange={handleBodyFormatChange}
          size="small"
        >
          <MenuItem value="json">JSON</MenuItem>
          <MenuItem value="x-www-form-urlencoded">x-www-form-urlencoded</MenuItem>
          <MenuItem value="form-data">Form Data</MenuItem>
          <MenuItem value="raw">Raw</MenuItem>
        </Select>
      </FormControl>
      
      {bodyFormat === 'json' ? (
        <Box sx={{ height: 300, border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: 1 }}>
          <JsonEditor 
            input={bodyContent} 
            onChange={handleJsonEditorChange}
          />
        </Box>
      ) : (
        <TextField
          fullWidth
          label="Body"
          multiline
          rows={10}
          value={bodyContent}
          onChange={handleBodyContentChange}
          placeholder={
            bodyFormat === 'x-www-form-urlencoded' ? 'key1=value1&key2=value2' :
            bodyFormat === 'form-data' ? '{\n  "key1": "value1",\n  "key2": "value2"\n}' :
            'Enter raw content here'
          }
          variant="outlined"
        />
      )}
    </Box>
  );
};