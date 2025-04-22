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
export const systemSettingsService = {
    


  // Fetch all Modules
  getList: async () => {
    
    const response = await apiClient.get("/system/settings");
    return response.data;
  },
  getConfig: async (id:string | undefined) => {

        
        const response = await apiClient.get("/system/settings/"+id);
        return response.data;
  },
  updateConfig: async (request: any) => {
        const response: any = await apiClient.post("/system/settings/update", request);
        return response.data;
  },
  createConfig: async (request: any) => {
        const response: any = await apiClient.post("/system/settings/update", request);
        return response.data;
  }
};
