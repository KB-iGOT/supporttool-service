import React, { createContext, useState, useContext, ReactNode } from 'react';
import { HttpMethod, Header, ApiResponse, BodyFormat } from './utils/types';

interface ApiCallContextType {
  // Request state
  url: string;
  setUrl: (url: string) => void;
  method: HttpMethod;
  setMethod: (method: HttpMethod) => void;
  headers: Header[];
  setHeaders: (headers: Header[]) => void;
  bodyFormat: BodyFormat;
  setBodyFormat: (format: BodyFormat) => void;
  bodyContent: string;
  setBodyContent: (content: string) => void;
  activeTab: 'headers' | 'body' | 'response';
  setActiveTab: (tab: 'headers' | 'body' | 'response') => void;
  curlCommand: string;
  setCurlCommand: (cmd: string) => void;
  
  // Response state
  loading: boolean;
  setLoading: (isLoading: boolean) => void;
  response: ApiResponse | null;
  setResponse: (response: ApiResponse | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Notification state
  showSnackbar: boolean;
  setShowSnackbar: (show: boolean) => void;
  snackbarMessage: string;
  setSnackbarMessage: (message: string) => void;
  
  // Helper methods
  showNotification: (message: string) => void;
}

const ApiCallContext = createContext<ApiCallContextType | undefined>(undefined);

export const ApiCallProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Request state
  const [url, setUrl] = useState<string>('https://api.example.com/endpoint');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
  ]);
  const [bodyFormat, setBodyFormat] = useState<BodyFormat>('json');
  const [bodyContent, setBodyContent] = useState<string>('{\n  "key": "value"\n}');
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'response'>('headers');
  const [curlCommand, setCurlCommand] = useState<string>('');
  
  // Response state
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Notification state
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // Helper for showing notifications
  const showNotification = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };
  
  return (
    <ApiCallContext.Provider value={{
      url, setUrl,
      method, setMethod,
      headers, setHeaders,
      bodyFormat, setBodyFormat,
      bodyContent, setBodyContent,
      activeTab, setActiveTab,
      curlCommand, setCurlCommand,
      loading, setLoading,
      response, setResponse,
      error, setError,
      showSnackbar, setShowSnackbar,
      snackbarMessage, setSnackbarMessage,
      showNotification
    }}>
      {children}
    </ApiCallContext.Provider>
  );
};

export const useApiCall = () => {
  const context = useContext(ApiCallContext);
  if (context === undefined) {
    throw new Error('useApiCall must be used within an ApiCallProvider');
  }
  return context;
};