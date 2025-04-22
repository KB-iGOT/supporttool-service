import axios from "axios";
import env from "../Config/env";
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

const userId = localStorage.getItem("userId");

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId ? userId : "",
  },
});

// API Service for Modules
export const usersService = {
    


  // Fetch all Modules
  getUsers: async (request: any) => {

    
    const response = await apiClient.post("/users", request);
    return response.data;
  },
  updateUser: async (userId: string, updatedFields: any) => {
    // Construct the request payload as expected by your API
    const requestPayload = {
      request: {
        userId,
        ...updatedFields
      }
    };
    debugger
    const response = {}
    // await apiClient.patch(`/users/${userId}`, requestPayload);
    return response;
  },
};
