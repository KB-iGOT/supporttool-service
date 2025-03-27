import axios from "axios";
import { Module } from "../types/modules";

// Base URL (Change according to your backend server)
const API_BASE_URL = "http://localhost:5000";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API Service for Modules
export const moduleService = {
  // Create a new Module
  createModule: async (data: Module) => {
    const response = await apiClient.post("/modules", data);
    return response.data;
  },

  // Fetch all Modules
  getModules: async () => {
    const response = await apiClient.get("/modules");
    return response.data;
  },

  // Update an existing Module
  updateModule: async (id: number, data: Module) => {
    const response = await apiClient.put(`/modules/${id}`, data);
    return response.data;
  },

  // Delete an existing Module
  deleteModule: async (id: number) => {
    const response = await apiClient.delete(`/modules/${id}`);
    return response.data;
  },
};
