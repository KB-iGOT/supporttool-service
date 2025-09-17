import axios from 'axios';
import env from "../Config/env";
import { getCookie } from '../utils';
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // <-- This enables cookies to be set from cross-origin responses
});

// Use an interceptor to dynamically add the userId to every request
apiClient.interceptors.request.use((config) => {
  const userId = getCookie('userId');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;