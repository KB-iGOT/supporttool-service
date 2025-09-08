import axios from 'axios';
import env from "../Config/env";
import { getCookie } from '../utils';
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

const userId = getCookie('userId');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId ?? '',
  },
  withCredentials: true, // <-- This enables cookies to be set from cross-origin responses
});
export default apiClient;