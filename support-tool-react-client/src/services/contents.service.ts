import axios from "axios";
import apiClient from "./apiClient";
import env from "../Config/env";
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

// API Service for Modules
export const contentsService = {
  // Fetch all Modules
  getContent: async (request: any) => {
    
    const response = await apiClient.post("/contents", request);
    return response.data;
  },
  retireContent: async ({identifier,jiraLink,module}: {identifier: string; jiraLink: string;module: string;}) => {

    try {
    const response = await apiClient.delete(`/contents/retire/${identifier}?jiraLink=${jiraLink}&module=${module}`);
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
      const response = await apiClient.post(
        `/contents/private/upload/${contentId}`,
        contentData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading private content:", error);
      throw error;
    }
  },
  privateContentUpdate: async (contentData: any, contentId:string) => {
    try {
      const response = await apiClient.patch(`/contents/private/update/${contentId}`, contentData);
      return response.data;
    } catch (error) {
      console.error("Error updating private content:", error);
      throw error;
    }
  },

  retirePrivateContent: async (contentId: string) => {

    try {
    const response = await apiClient.delete(`/contents/private/retire/${contentId}`);
    return response.data;
    } catch (error) {
      console.error("Error retiring content:", error);
      throw error;
    }
  },

  privateContentRead: async (contentId: string) => {

    try {
    const response = await apiClient.get(`/contents/private/read/${contentId}`);
    return response.data;
    } catch (error) {
      console.error("Error retiring content:", error);
      throw error;
    }
  },
};
