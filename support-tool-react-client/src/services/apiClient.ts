import axios from 'axios';
import env from "../Config/env";
import { getCookie } from '../utils';

const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // <-- This enables cookies to be set from cross-origin responses
});

// Use an interceptor to dynamically add the userId to every request
// Also set baseURL here so it reads env.apiBaseUrl after window._env_ is populated
apiClient.interceptors.request.use((config) => {
  config.baseURL = env.apiBaseUrl;
  const userId = getCookie('userId');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;