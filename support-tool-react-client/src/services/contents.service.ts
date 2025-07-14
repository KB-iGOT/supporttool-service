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
export const contentsService = {
  // Fetch all Modules
  getContent: async (request: any) => {
    
    const response = await apiClient.post("/contents", request);
    return response.data;
  },
  retireContent: async ({identifier,jiraLink,moduleId}: {identifier: string; jiraLink: string;moduleId: number;}) => {

    try {
    const response = await apiClient.delete(`/contents/retire/${identifier}?jiraLink=${jiraLink}?moduleId=${moduleId}`);
    return response.data;
    } catch (error) {
      console.error("Error retiring content:", error);
      throw error;
    }
  },
  privateContentCreate: async (contentData: any) => {
    try {
      const response = await apiClient.post("/contents/private/create", contentData);
      return response.data;
    } catch (error) {
      console.error("Error creating private content:", error);
      throw error;
    }
  },

  privateContentUpload: async (contentData: any, contentId:string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/contents/private/upload/${contentId}`, 
        contentData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-user-id': userId ?? '',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating private content:", error);
      throw error;
    }
  }
};
