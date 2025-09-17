import apiClient from "./apiClient";

// API Service for Modules
export const competencyService = {
    
  getFormsFacets: async () => {
    const response = await apiClient.get("/forms/facets");
    return response.data;
  },
  searchCompetencySubThemes: async (params: any) => {
    return await apiClient.post('/competency/competencySubTheme/search', params);
  },
  searchCompetencyThemes: async (params: any) => {
    // The API seems to expect a POST with a JSON payload.
    return await apiClient.post('/competency/competencyTheme/search', params);
},
createCompetencyTheme: async (params: any) => {
    return await apiClient.post('/competency/competencyTheme/create', params);
},
createCompetencySubTheme: async (params: any) => {
    return await apiClient.post('/competency/competencySubTheme/create', params);
},

};  
