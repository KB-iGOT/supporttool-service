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
export const nonLoggedInServive = {
  // Fetch all Modules
  privateSearch: async (payload:any) => {
    const response = await apiClient.post(`/private/search`, payload);
    return response.data;
  },
};
