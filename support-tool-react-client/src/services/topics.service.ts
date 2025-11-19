import apiClient from "./apiClient";

// API Service for Topics
export const topicsService = {
  // Fetch all topics with filters, pagination, and search
  getTopics: async (pageNumber: number = 0, pageSize: number = 10, filterCriteriaMap: any = {}) => {
    const response = await apiClient.post("/topics/list", {
      filterCriteriaMap,
      requestedFields: [],
      pageNumber,
      pageSize
    });
    return response.data;
  },

  // Create a new topic
  createTopic: async (auditData: any) => {
    const response = await apiClient.post("/topics/create", auditData);
    return response.data;
  },

  // Update an existing topic
  updateTopic: async (auditData: any) => {
    const response = await apiClient.put("/topics/update", auditData);
    return response.data;
  },

  // Delete a topic
  deleteTopic: async (auditData: any) => {
    const response = await apiClient.delete("/topics/delete", { data: auditData });
    return response.data;
  },
};
