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
export const domainService = {
  // Fetch all Modules
  fetchDomains: async () => {
    const response = await apiClient.get(`/domains`);
    return response.data;
  },
  addDomain: async (requestPayload: any) => {
    try {
      const response = await apiClient.post(`/domains/add`,requestPayload);
    return response.data;
    } catch (error) {
      console.error("Error in addDomain service:", error);
      throw error; // Propagate error to be handled by component
    }
  },
  deleteDomain: async (domainName: string) => {
    const response = await apiClient.get(`/domains/delete/${domainName}`);
    return response.data;
  },
};
