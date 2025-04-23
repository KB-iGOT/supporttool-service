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
export const channelsService = {
  // Fetch all Modules
  fetchChannel: async (id: string) => {
    const response = await apiClient.get(`/channels/${id}`);
    return response.data;
  }
};
