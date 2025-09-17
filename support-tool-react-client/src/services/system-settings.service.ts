import apiClient from "./apiClient";

// API Service for Modules
export const systemSettingsService = {
    


  // Fetch all Modules
  getList: async () => {
    
    const response = await apiClient.get("/system/settings");
    return response.data;
  },
  getConfig: async (id:string | undefined) => {

        
        const response = await apiClient.get("/system/settings/"+id);
        return response.data;
  },
  updateConfig: async (request: any) => {
        const response: any = await apiClient.post("/system/settings/update", request);
        return response.data;
  },
  createConfig: async (request: any) => {
        const response: any = await apiClient.post("/system/settings/create", request);
        return response.data;
  }
};
