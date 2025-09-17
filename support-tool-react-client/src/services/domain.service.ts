import apiClient from "./apiClient";

// API Service for Modules
export const domainService = {
  // Fetch all Modules
  fetchDomains: async () => {
    const response = await apiClient.get(`/domains`);
    return response.data;
  },
  addDomain: async (requestPayload: any) => {
    try {
      const response = await apiClient.post(`/domains/add`, requestPayload);
      return response.data;
    } catch (error) {
      console.error("Error in addDomain service:", error);
      throw error; // Propagate error to be handled by component
    }
  },
  deleteDomain: async (domainName: string, auditPayload: any) => {
    const response = await apiClient.post(`/domains/delete/${domainName}`, auditPayload);
    return response.data;
  },
};
