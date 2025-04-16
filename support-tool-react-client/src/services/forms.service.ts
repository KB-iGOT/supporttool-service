import axios from "axios";
import env from "../Config/env";
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

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
export const formsService = {
    


  // Fetch all Modules
  getForms: async (request: any) => {

    
    const response = await apiClient.post("/forms", request);
    return response.data;
  }
};
