import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Grid,
  Tab,
  Tabs,
  Alert,
  LinearProgress,
  Snackbar,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';

import { JsonEditor } from './../common-components/json-editor/json-editor';

// HTTP method types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Header type
interface Header {
  key: string;
  value: string;
}

// API response interface
interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
}

export const ApiCalls: React.FC = () => {
  // Request state with default values
  const [url, setUrl] = useState<string>('https://api.example.com/endpoint');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
  ]);
  const [bodyFormat, setBodyFormat] = useState<'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw'>('json');
  const [bodyContent, setBodyContent] = useState<string>('{\n  "key": "value"\n}');
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'response'>('headers');
  const [curlCommand, setCurlCommand] = useState<string>('');
  
  // Response state
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');


  // Handle URL change
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  // Handle method change - fixed with proper typing
  const handleMethodChange = (event: SelectChangeEvent<HttpMethod>) => {
    setMethod(event.target.value as HttpMethod);
    
    // Auto-switch to body tab for methods that typically have a body
    if (['POST', 'PUT', 'PATCH'].includes(event.target.value) && activeTab === 'headers') {
      setActiveTab('body');
    }
  };

  // Handle header changes
  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  // Add new header
  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  // Remove header
  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
  };

  // Handle body format change - fixed with proper typing
  const handleBodyFormatChange = (event: SelectChangeEvent) => {
    const newFormat = event.target.value as 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';
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

  // Handle body content change
  const handleBodyContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBodyContent(event.target.value);
  };

  // Add a handler for JsonEditor changes
  const handleJsonEditorChange = (json: string) => {
    setBodyContent(json);
  };

  // Parse curl command
  const parseCurlCommand = (cmdOverride?: string) => {
    try {
      let cmd = cmdOverride || curlCommand.trim();
      
      // Handle multi-line curl commands (from Postman)
      cmd = cmd.replace(/\\\s*\n\s*/g, ' '); // Replace backslash + newline with space
      
      if (!cmd.startsWith('curl')) {
        setSnackbarMessage('Invalid cURL command. Command must start with "curl"');
        setShowSnackbar(true);
        return;
      }

      // Extract URL - improved regex for Postman-style URLs with --location
      const locationUrlMatch = cmd.match(/curl\s+--location\s+['"]([^'"]+)['"]/);
      if (locationUrlMatch && locationUrlMatch[1]) {
        setUrl(locationUrlMatch[1]);
      } else {
        // Try regular curl URL format
        const regularUrlMatch = cmd.match(/curl\s+(?:-X\s+[A-Z]+\s+)?['"]([^'"]+)['"]/);
        if (regularUrlMatch && regularUrlMatch[1]) {
          setUrl(regularUrlMatch[1]);
        } else {
          // Last resort: try to match any non-whitespace after curl that's not a flag
          const fallbackUrlMatch = cmd.match(/curl\s+(?!-)[^\s]+/);
          if (fallbackUrlMatch) {
            setUrl(fallbackUrlMatch[0].replace('curl ', ''));
          }
        }
      }

      // Extract method
      const methodMatch = cmd.match(/-X\s+([A-Z]+)/i);
      if (methodMatch && methodMatch[1]) {
        setMethod(methodMatch[1].toUpperCase() as HttpMethod);
      } else {
        // Default to GET unless there's data to send
        setMethod(cmd.includes('-d') || cmd.includes('--data') ? 'POST' : 'GET');
      }

      // Extract headers - handle both --header and -H formats
      const headerRegex = /(?:--header|-H)\s+['"]([^'"]+)['"]/g;
      let match;
      const extractedHeaders: Header[] = [];
      
      while ((match = headerRegex.exec(cmd)) !== null) {
        if (match[1]) {
          const headerParts = match[1].split(':').map(p => p.trim());
          if (headerParts.length >= 2) {
            const key = headerParts[0];
            const value = headerParts.slice(1).join(':');
            extractedHeaders.push({ key, value });
          }
        }
      }
      
      // If we found headers, use them; otherwise keep the current headers
      if (extractedHeaders.length > 0) {
        setHeaders(extractedHeaders);
        
        // Set body format based on content-type header
        const contentTypeHeader = extractedHeaders.find(h => h.key.toLowerCase() === 'content-type');
        if (contentTypeHeader) {
          if (contentTypeHeader.value.includes('application/json')) {
            setBodyFormat('json');
          } else if (contentTypeHeader.value.includes('application/x-www-form-urlencoded')) {
            setBodyFormat('x-www-form-urlencoded');
          } else if (contentTypeHeader.value.includes('multipart/form-data')) {
            setBodyFormat('form-data');
          } else {
            setBodyFormat('raw');
          }
        }
      }

      // Extract body content
      // Look for patterns like --data '{...}' or -d '{...}'
      // This regex finds the body content between quotes after --data or -d flags
      const dataPattern = /(?:--data|-d)\s+(['"])([\s\S]*?)\1(?:\s|$)/;
      const dataMatch = cmd.match(dataPattern);
      
      if (dataMatch && dataMatch[2]) {
        let body = dataMatch[2];
        
        // Try to parse as JSON
        try {
          // Check if the body content looks like JSON
          if ((body.startsWith('{') && body.endsWith('}')) || 
              (body.startsWith('[') && body.endsWith(']'))) {
            // Parse and format the JSON
            const parsedBody = JSON.parse(body);
            setBodyContent(JSON.stringify(parsedBody, null, 2));
            setBodyFormat('json');
            
            // Auto-switch to body tab
            setActiveTab('body');
          } else {
            // Not JSON, use as raw or form-urlencoded
            setBodyContent(body);
            if (body.includes('=') && !body.includes('{') && !body.includes('[')) {
              setBodyFormat('x-www-form-urlencoded');
            } else {
              setBodyFormat('raw');
            }
            
            // Auto-switch to body tab
            setActiveTab('body');
          }
        } catch (e) {
          // If JSON parsing fails, still display the content
          setBodyContent(body);
          setBodyFormat('raw');
          
          // Auto-switch to body tab
          setActiveTab('body');
        }
      } else {
        // Try an alternative approach for unquoted data
        // This might happen when JSON is provided directly after -d without quotes
        const alternativeDataMatch = cmd.match(/(?:--data|-d)\s+({[\s\S]*})/);
        if (alternativeDataMatch && alternativeDataMatch[1]) {
          try {
            const jsonCandidate = alternativeDataMatch[1];
            // Remove escaped newlines and quotes
            const cleanJson = jsonCandidate.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            
            // Try to parse as JSON
            const parsedJson = JSON.parse(cleanJson);
            setBodyContent(JSON.stringify(parsedJson, null, 2));
            setBodyFormat('json');
            setActiveTab('body');
          } catch (e) {
            // Use as raw text if parsing fails
            setBodyContent(alternativeDataMatch[1]);
            setBodyFormat('raw');
            setActiveTab('body');
          }
        }
      }

      // Clear the curl command input after successful parsing
      setCurlCommand('');
      
      setSnackbarMessage('cURL command parsed successfully');
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error parsing cURL command:', error);
      setSnackbarMessage('Failed to parse cURL command');
      setShowSnackbar(true);
    }
  };

  // Handle curl command change
  const handleCurlCommandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurlCommand(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'headers' | 'body' | 'response') => {
    setActiveTab(newValue);
  };

  // Format JSON for display
  const formatJSON = (json: any): string => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (err) {
      return String(json);
    }
  };

  // Determine if response data is JSON
  const isJsonResponse = (): boolean => {
    if (!response) return false;
    
    try {
      return typeof response.data === 'object';
    } catch (err) {
      return false;
    }
  };

  // Copy response to clipboard
  const copyToClipboard = () => {
    if (!response) return;
    
    navigator.clipboard.writeText(formatJSON(response.data))
      .then(() => {
        setSnackbarMessage('Response copied to clipboard');
        setShowSnackbar(true);
      })
      .catch(() => {
        setSnackbarMessage('Failed to copy to clipboard');
        setShowSnackbar(true);
      });
  };

  // Download response as JSON file
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

  // Send the API request
  const sendRequest = async () => {
    setError(null);
    setResponse(null);
    setLoading(true);
    
    try {
      if (!url) {
        throw new Error('URL is required');
      }

      // Build headers object
      const headersObj: Record<string, string> = {};
      headers.forEach(header => {
        if (header.key && header.value) {
          headersObj[header.key] = header.value;
        }
      });

      // Set content type header based on body format if it's not already set
      if (method !== 'GET' && method !== 'HEAD' && !headersObj['Content-Type']) {
        if (bodyFormat === 'json') {
          headersObj['Content-Type'] = 'application/json';
        } else if (bodyFormat === 'x-www-form-urlencoded') {
          headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (bodyFormat === 'form-data') {
          // Don't set Content-Type for form-data, let the browser set it with boundary
        } else {
          headersObj['Content-Type'] = 'text/plain';
        }
      }

      // Prepare request options
      const options: RequestInit = {
        method,
        headers: headersObj,
      };

      // Add body for non-GET/HEAD requests
      if (method !== 'GET' && method !== 'HEAD' && bodyContent) {
        if (bodyFormat === 'json') {
          try {
            options.body = JSON.stringify(JSON.parse(bodyContent));
          } catch (e) {
            throw new Error('Invalid JSON in request body');
          }
        } else if (bodyFormat === 'x-www-form-urlencoded') {
          options.body = bodyContent; // Assume properly formatted
        } else if (bodyFormat === 'form-data') {
          // For form-data, we would need to build a FormData object
          const formData = new FormData();
          try {
            const formValues = JSON.parse(bodyContent);
            Object.entries(formValues).forEach(([key, value]) => {
              formData.append(key, String(value));
            });
            options.body = formData;
            // Remove content-type header to let browser set it with boundary
            delete headersObj['Content-Type'];
          } catch (e) {
            throw new Error('Invalid form data format. Expected JSON object.');
          }
        } else {
          // Raw text
          options.body = bodyContent;
        }
      }

      // Measure response time
      const startTime = performance.now();
      
      // Make the API call
      const response = await fetch(url, options);
      const endTime = performance.now();
      
      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body based on content type
      let data: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text();
      } else {
        // For binary data, we'll just indicate it's binary
        data = '[Binary data]';
      }

      // Set the response
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        time: Math.round(endTime - startTime)
      });
      
      // Switch to response tab
      setActiveTab('response');
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      // Still show the response tab even on error
      setActiveTab('response');
    } finally {
      setLoading(false);
    }
  };

  // Parse the default curl command when component loads
  useEffect(() => {
    // Parse default curl command on first load
    parseCurlCommand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        API Execution Tool
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        {/* cURL Import Section */}
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
              onClick={() => parseCurlCommand()}
              startIcon={<CodeIcon />}
              disabled={!curlCommand}
            >
              Parse
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
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
            onClick={sendRequest}
            disabled={loading || !url}
          >
            Execute
          </Button>
        </Box>
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="api-tabs">
          <Tab label="Headers" value="headers" />
          <Tab label="Body" value="body" disabled={method === 'GET' || method === 'HEAD'} />
          <Tab label="Response" value="response" disabled={!response && !error} />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {activeTab === 'headers' && (
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
          )}
          
          {activeTab === 'body' && (
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
          )}
          
          {activeTab === 'response' && (
            <Box>
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : response ? (
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
                  
                  {isJsonResponse() ? (
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
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No response data available. Execute a request to see results.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      
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
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};