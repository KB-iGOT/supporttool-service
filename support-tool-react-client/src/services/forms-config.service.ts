import apiClient from "./apiClient";

// API Service for Forms Config
export const formsConfigService = {
  getFormsConfigList: async () => {
    const response = await apiClient.get("/forms-config/list");
    return response.data;
  },
  getFormsConfigById: async (id: string | number) => {
    const response = await apiClient.get(`/forms-config/read/${encodeURIComponent(String(id))}`);
    return response.data;
  },
  createFormsConfig: async (request: any) => {
    const response = await apiClient.post("/forms-config/create", request);
    return response.data;
  },
  updateFormsConfig: async (request: any) => {
    const response = await apiClient.put("/forms-config/update", request);
    return response.data;
  },
};
