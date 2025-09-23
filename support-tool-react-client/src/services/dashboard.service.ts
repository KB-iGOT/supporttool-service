import apiClient from "./apiClient";

// API Service for Modules
export const dashboardService = {
  // Fetch all Modules
  getModules: async () => {
    const response = await apiClient.get("/dashboard");
    return response.data;
  },
  // Fetch sub-modules for a given root module
  getSubModules: async (root: string) => {
    const response = await apiClient.get(`/dashboard/submodules?root=${root}`);
    return response.data;
  }
};
