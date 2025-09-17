import apiClient from "./apiClient";

// API Service for Modules
export const formsService = {
    
  getFormsFacets: async () => {
    const response = await apiClient.get("/forms/facets");
    return response.data;
  },
  getFormReadData: async (request: any) => {
    
    const response = await apiClient.post(`/forms/read`, request);
    return response.data;
  },
  updateFormData: async (request: any) => {
    const response = await apiClient.post(`/forms/update`, request);
    return response.data;
  },
  createFormData: async (request: any) => {
    
    const response = await apiClient.post(`/forms/create`, request);
    return response.data;
  },
  deleteFormData: async (request: any) => {
    const response = await apiClient.post(`/forms/delete`, request);
    return response.data;
  },
};
