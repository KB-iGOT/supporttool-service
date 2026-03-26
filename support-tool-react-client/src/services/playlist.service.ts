import apiClient from "./apiClient";

export const playlistService = {
  // Search playlists with filters and pagination
  searchPlaylists: async (
    pageNumber: number = 0,
    pageSize: number = 10,
    filterCriteriaMap: Record<string, any> = {}
  ) => {
    const response = await apiClient.post("/playlist/search", {
      filterCriteriaMap,
      requestedFields: [],
      pageNumber,
      pageSize,
    });
    return response.data;
  },

  // Create a new playlist
  createPlaylist: async (data: {
    requestPayload: {
      type: string;
      orgId: string;
      ownerId: string;
      children: string[];
    };
    jiraLink?: string;
    module?: string;
  }) => {
    const response = await apiClient.post("/playlist/create", data);
    return response.data;
  },

  // Update an existing playlist
  updatePlaylist: async (data: {
    requestPayload: {
      type: string;
      orgId: string;
      ownerId: string;
      children: string[];
    };
    jiraLink?: string;
    module?: string;
  }) => {
    const response = await apiClient.put("/playlist/update", data);
    return response.data;
  },

  // Read a single playlist by playlistKey and orgId
  readPlaylist: async (playlistKey: string, orgId: string) => {
    const response = await apiClient.get(`/playlist/read/${playlistKey}/${orgId}`);
    return response.data;
  },
};
