import apiClient from "./apiClient";

// API Service for authentication
export const authService = {
  // Create a new Module
  auth: async (data: {username: string; password: string;}) => {
    const response = await apiClient.post("/auth", data);
    return response.data;
  },
  logout: async () => {
    try {
      const response = await apiClient.post("/auth/logout");
      return response.data;
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }
};
