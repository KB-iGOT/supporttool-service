import axios from "axios";

// Base URL (Change according to your backend server)
const API_BASE_URL = "http://localhost:5000";

const userId = localStorage.getItem("userId");

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId ? userId : "",
  },
});

// API Service for Modules
export const contentsService = {
  // Fetch all Modules
  getContent: async (request: any) => {
    
    const response = await apiClient.post("/contents", request);
    return response.data;
  }
};
