import React, { useEffect } from 'react';
import { Box, Typography, Paper, Divider, Tabs, Tab, LinearProgress, Snackbar } from '@mui/material';
import { ApiCallProvider, useApiCall } from './ApiCallContext';
import { CurlImport } from './components/CurlImport';
import { RequestForm } from './components/RequestForm';
import { HeadersEditor } from './components/HeadersEditor';
import { BodyEditor } from './components/BodyEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { UsageGuide } from './components/UsageGuide';

// Main content component that uses the context
const ApiCallsContent: React.FC = () => {
  const { 
    activeTab, setActiveTab,
    method, loading,
    response, error,
    showSnackbar, setShowSnackbar,
    snackbarMessage
  } = useApiCall();

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'headers' | 'body' | 'response') => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        API Execution Tool
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <CurlImport />
        
        <Divider sx={{ my: 2 }} />
        
        <RequestForm />
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="api-tabs">
          <Tab label="Headers" value="headers" />
          <Tab label="Body" value="body" disabled={method === 'GET' || method === 'HEAD'} />
          <Tab label="Response" value="response" disabled={!response && !error} />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {activeTab === 'headers' && <HeadersEditor />}
          {activeTab === 'body' && <BodyEditor />}
          {activeTab === 'response' && <ResponseViewer />}
        </Box>
      </Paper>
      
      <UsageGuide />
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

// Wrapper component that provides the context
export const ApiCalls: React.FC = () => {
  return (
    <ApiCallProvider>
      <ApiCallsContent />
    </ApiCallProvider>
  );
};