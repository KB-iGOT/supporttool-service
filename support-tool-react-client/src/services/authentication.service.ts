import axios from "axios";

import env from "../Config/env";
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// API Service for authentication
export const authService = {
  // Create a new Module
  auth: async (data: {username: string; password: string;}) => {
    const response = await apiClient.post("/auth", data);
    return response.data;
  },
  logout: async () => {
    try {
      const response = await apiClient.post("/auth/logout");
      return response.data;
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }
};
