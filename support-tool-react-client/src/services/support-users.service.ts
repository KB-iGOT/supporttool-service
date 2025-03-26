import axios from "axios";
import { ICreateUser } from "../types/users";

// Base URL (Change according to your backend server)
const API_BASE_URL = "http://localhost:5000";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
