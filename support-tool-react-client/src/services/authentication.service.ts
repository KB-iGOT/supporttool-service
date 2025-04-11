import axios from "axios";

// Base URL (Change according to your backend server)
const API_BASE_URL = "http://localhost:5000";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
    const response = await apiClient.post("/auth/logout");
    return response.data;
  }
};
