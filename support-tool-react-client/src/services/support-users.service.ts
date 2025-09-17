import apiClient from "./apiClient";
import { ICreateUser } from "../types/users";

// API Service for Users
export const supportUserService = {
  // Create a new user
  createUser: async (userData: ICreateUser) => {
    const response = await apiClient.post("/support-users", userData);
    return response.data;
  },

  // Fetch all users
  getUsers: async () => {
    const response = await apiClient.get("/support-users");
    return response.data;
  },

  // Update an existing user
  updateUser: async (userId: string | undefined, userData: ICreateUser) => {
    const response = await apiClient.put(`/support-users/${userId}`, userData);
    return response.data;
  },

  // Delete an existing user
  deleteUser: async (userId: string | undefined) => {
    const response = await apiClient.delete(`/support-users/${userId}`);
    return response.data;
  },
};
