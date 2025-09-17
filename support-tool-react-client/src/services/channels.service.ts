import apiClient from "./apiClient";

// API Service for Modules
export const channelsService = {
  // Fetch all Modules
  fetchChannel: async (id: string) => {
    const response = await apiClient.get(`/channels/${id}`);
    return response.data;
  }
};
