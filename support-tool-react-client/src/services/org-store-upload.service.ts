import apiClient from "./apiClient";

export const orgStoreUploadService = {
  /**
   * Upload asset to org store.
   * Same endpoint for both KB Org and Other Org.
   *   • KB Org   → omit selectedUserToken → server uses session token
   *   • Other Org → pass selectedUserToken → server uses that token
   */
  upload: async (file: File, selectedUserToken?: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };
    if (selectedUserToken) {
      headers["x-selected-user-token"] = selectedUserToken;
    }
    const response = await apiClient.post("/org-store-upload/upload", formData, {
      headers,
    });
    return response.data;
  },

  /**
   * Get an impersonation token for a specific user (Other Org flow).
   */
  getTokenForUser: async (userId: string): Promise<any> => {
    const response = await apiClient.get(
      `/org-store-upload/user-token/${userId}`
    );
    return response.data;
  },
};
