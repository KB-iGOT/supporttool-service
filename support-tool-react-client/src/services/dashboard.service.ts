import axios from "axios";

import env from "../Config/env";
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API Service for Modules
export const dashboardService = {
  // Fetch all Modules
  getModules: async () => {
    const response = await apiClient.get("/dashboard");
    return response.data;
  }
};
