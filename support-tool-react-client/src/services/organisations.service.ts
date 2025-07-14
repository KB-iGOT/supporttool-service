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
export const organisationService = {
  // Fetch all Modules
  fetchOrganisations: async () => {
    const response = await apiClient.get(`/org`);
    return response.data;
  },
  fetchOrganisationsData: async (request:any) => {
    const response = await apiClient.post(`/org/search`, request);
    return response.data;
  },
  fetchOrganisationByName: async (orgName:string) => {
    
    const response = await apiClient.get(`/org/`+ orgName);
    return response.data;
  },

  deleteOrganisationById: async (orgId:number) => {
    
    const response = await apiClient.get(`/org/delete/`+ orgId);
    return response.data;
  }
};
