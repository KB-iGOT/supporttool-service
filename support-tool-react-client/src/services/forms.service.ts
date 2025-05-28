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
export const formsService = {
    
  getFormsFacets: async () => {
    const response = await apiClient.get("/forms/facets");
    return response.data;
  },
  getFormReadData: async (request: any) => {
    
    const response = await apiClient.post(`/forms/read`, request);
    return response.data;
  },
  updateFormData: async (request: any) => {
    const response = await apiClient.post(`/forms/update`, request);
    return response.data;
  },
  createFormData: async (request: any) => {
    
    const response = await apiClient.post(`/forms/create`, request);
    return response.data;
  },
};
