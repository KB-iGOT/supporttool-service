import apiClient from "./apiClient";

// API Service for Modules
export const organisationService = {
  // Fetch all Modules
  fetchOrganisations: async (request: any) => {
    const response = await apiClient.post(`/org`, request);
    return response.data;
  },
  fetchOrganisationsData: async (request:any) => {
    const response = await apiClient.post(`/org/search`, request);
    return response.data;
  },
  fetchOrganisationByName: async (orgName:string) => {
    
    const response = await apiClient.get(`/org/`+ orgName);
    return response.data;
  },

  deleteOrganisationById: async (orgId:number) => {
    
    const response = await apiClient.get(`/org/delete/`+ orgId);
    return response.data;
  }
};
