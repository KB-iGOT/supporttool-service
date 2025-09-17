import apiClient from "./apiClient";

// API Service for Modules
export const nonLoggedInServive = {
  // Fetch all Modules
  privateSearch: async (payload:any) => {
    const response = await apiClient.post(`/private/search`, payload);
    return response.data;
  },
};
