import axios from "axios";
import env from "../Config/env";
import { getCookie } from "../utils";

// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

const userId = getCookie('userId');

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId ?? '',
  },
});

// API Service for Modules
export const apiCallService = {
  // The original API call method
  callApi: async (request: any) => {
    const response = await apiClient.post("/execution", request);
    return response.data;
  },
  
  // New proxy method for the API Tool
  proxyApiCall: async (requestConfig: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  }) => {
    // Send the request through your backend proxy
    const response = await apiClient.post("/proxy", {
      url: requestConfig.url,
      method: requestConfig.method,
      headers: requestConfig.headers,
      body: requestConfig.body
    });
    
    return response.data;
  }
};
