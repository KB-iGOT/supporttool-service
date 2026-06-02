import apiClient from "./apiClient";

// API Service for Modules
export const usersService = {
  // Fetch all Modules
  getUsers: async (request: any) => {
    const response = await apiClient.post("/users", request);
    return response.data;
  },
  getUserByEmail: async (request: any) => {
    const response = await apiClient.post(`/users/email`, request);
    return response.data;
  },
  updateUser: async (requestPayload: any) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.patch(`/users/${requestPayload?.userId}`, requestPayload);
    return response.data;
  },
  updateUserV1: async (userId: string, requestPayload: any) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.patch(`/users/update/${userId}`, requestPayload);
    return response.data;
  },
  updateUserExt: async (requestPayload: any) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.post(`/users/admin/extPatch`, requestPayload);
    return response.data;
  },
  assignUserRoles: async (userId: string, organisationId: string, roles: string[]) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.post(`/users/role/assign`, {
      request: {
        userId,
        organisationId,
        roles
      }
    });
    return response.data;
  },
  modifyUserRoles: async (requestData: any) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.post(`/users/role/update`, requestData);
    return response.data;
  },
  getUserContentEnrollList: async (userId: string) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.get(`/users/content/enrollment/list/${userId}`);
    return response.data;
  },
  downloadcertificate: async (certId: string) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.get(`/users//certs/download/${certId}`);
    return response.data;
  },
  reissuecertificate: async (requestPayload: any) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.post(`/users/cert/reissue`, requestPayload);
    return response.data;
  },
  getUserEventEnrollList: async (userId: string) => {
    // Construct the request payload as expected by your API
    const response = await apiClient.get(`/users/event/enrollment/list/${userId}`);
    return response.data;
  },
  /**
   * Creates a new user
   * @param payload The user data to create
   * @returns API response
   */
  createUser: async (requestPayload: any) => {
    try {
      const response = await apiClient.post(
        `/users/profileDetails/createUser`,
        requestPayload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
  /**
   * Migrates a user to a new organization
   * @param userId The ID of the user to migrate
   * @param data Migration options
   * @returns API response
   */
  migrateUser: async (request: any) => {
    try {
      const response = await apiClient.patch(
        `/users/migrate`,
        request
      );
      return response.data;
    } catch (error) {
      console.error("Error migrating user:", error);
      throw error;
    }
  },
  /**
   * Resets a user's password and generates a reset link
   * @param userId The ID of the user to reset password for
   * @param type The notification method (email)
   * @returns API response with reset link
   */
  resetPassword: async (request: any) => {
    try {
      const response = await apiClient.post(
        `/users/password/reset`,
        request
      );
      return response.data;
    } catch (error) {
      console.error("Error resetting user password:", error);
      throw error;
    }
  },
  /**
   * Blocks a user account
   * @param userId The ID of the user to block
   * @param requestedById The ID of the admin user making the request
   * @returns API response
   */
  blockUser: async (requestData: any) => {
    try {
      const response = await apiClient.post(
        `/users/block`,requestData
      );
      return response.data;
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  },
  /**
   * Deactivates a list of users in bulk.
   * @param requestData The bulk deactivation request payload
   * @returns API response
   */
  deactivateBulkUser: async (requestData: any) => {
    try {
      const response = await apiClient.post(`/users/deactivate-bulk`, requestData);
      return response.data;
    } catch (error) {
      console.error("Error deactivating bulk users:", error);
      throw error;
    }
  },
  /**
   * Migrates a list of users in bulk.
   * @param requestData The bulk migration request payload
   * @returns API response
   */
  migrateBulkUser: async (requestData: any) => {
    try {
      const response = await apiClient.post(`/users/migrate-bulk`, requestData);
      return response.data;
    } catch (error) {
      console.error("Error migrating bulk users:", error);
      throw error;
    }
  },
  
  /**
   * Migrates a list of users in bulk using V2 API for large datasets.
   * Supports chunk-based processing with enhanced error handling and performance metrics.
   * @param requestData The bulk migration request payload with chunk information
   * @returns API response with enhanced details
   */
  migrateBulkUserV2: async (requestData: any) => {
    try {
      const response = await apiClient.post(`/users/migrate-bulk-v2`, requestData);
      return response.data;
    } catch (error) {
      console.error("Error migrating bulk users V2:", error);
      throw error;
    }
  },
  /**
   * Unblocks a previously blocked user account
   * @param userId The ID of the user to unblock
   * @param requestedById The ID of the admin user making the request
   * @returns API response
   */
  unblockUser: async (requestData: any) => {
    try {
      const response = await apiClient.post(
        `/users/unblock`,requestData
      );
      return response.data;
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  },
  fetchGroups: async () => {
    const response = await apiClient.get(`/users/v1/groups`);
    return response.data;
  },
  fetchCadreData: async () => {
    const response = await apiClient.get(`/users/v1/cadre-config`);
    return response.data;
  },
  fetchMasterLanguages: async () => {
    const response = await apiClient.get(`/users/v1/master-languages`);
    return response.data;
  },
  getCBPlan: async (userId: string, rootOrgId: string) => {
    try {
      const response = await apiClient.post(`/users/v1/cbplan`, { userId, rootOrgId });
      return response.data;
    } catch (error) {
      console.error("Error fetching CBP plan:", error);
      throw error;
    }
  },
  getAssignedCAP: async (userId: string, rootOrgId: string) => {
    try {
      const response = await apiClient.post(`/users/v2/assigned-cap`, { userId, rootOrgId });
      return response.data;
    } catch (error) {
      console.error("Error fetching assigned CAP:", error);
      throw error;
    }
  },
  getCBPlanDetails: async (planId: string) => {
    try {
      const response = await apiClient.get(`/users/v2/cbplan/${planId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching CBP plan details:", error);
      throw error;
    }
  },
  getEnrollmentDetails: async (userId: string, courseIds: string[]) => {
    try {
      const response = await apiClient.post(`/users/enrollment/details/${userId}`, { courseIds });
      return response.data;
    } catch (error) {
      console.error("Error fetching enrollment details:", error);
      throw error;
    }
  }
};
