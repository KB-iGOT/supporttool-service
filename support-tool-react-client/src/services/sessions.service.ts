import apiClient from "./apiClient";
export const sessionService = {
  async getSessions() {
    try {
      const response = await apiClient.get('/sessions');
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  },

  async deleteSession(sid: string) {
    const response = await apiClient.delete(`/sessions/${sid}`);
    return response.data;
  },

  async deleteAllSessions() {
    const response = await apiClient.delete('/sessions');
    return response.data;
  },
};