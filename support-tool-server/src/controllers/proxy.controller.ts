import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { Request, Response } from 'express';

interface ProxyRequestBody {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

// Proxy controller to handle API calls
export const proxyRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, method, headers, body } = req.body as ProxyRequestBody;
    
    // Log the incoming request
    console.log(`Proxying ${method} request to: ${url}`);
    
    // Create options for the axios request
    const options: AxiosRequestConfig = {
      url,
      method,
      headers: { ...headers },
      validateStatus: () => true, // Accept any status code
    };
    
    // Add body for non-GET/HEAD requests
    if (method !== 'GET' && method !== 'HEAD' && body) {
      options.data = body;
    }
    
    // Make the actual request
    const response: AxiosResponse = await axios(options);
    
    // Return the response to the client
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
  } catch (error) {
    const err = error as AxiosError;
    console.error('Proxy error:', err.message);
    
    // Return error information
    res.status(500).json({
      status: err.response?.status || 500,
      statusText: err.message,
      headers: err.response?.headers || {},
      data: err.response?.data || { error: err.message }
    });
  }
};