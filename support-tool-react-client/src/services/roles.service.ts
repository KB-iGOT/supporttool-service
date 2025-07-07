import axios from "axios";

import env from "../Config/env";
import { get } from "http";
import { getCookie } from "../utils";
// Base URL (Change according to your backend server)
const API_BASE_URL = env.apiBaseUrl;

const userId = getCookie('userId');

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId ?? '',
  },
});

// API Service for Modules
export const rolesService = {

  // Fetch all Modules
  getRoles: async () => {
    const response = await apiClient.get("/roles");
    return response.data;
  },
  createRole: async (data: { name: string }) => {
    const response = await apiClient.post("/roles/create", data);
    return response.data;
  },
  updateRole: async (id: any, data: any) => {
    const response = await apiClient.put(`/roles/update/${id}`, data);
    return response.data;
  },
  getRolePermissions: async (roleId: any) => {
    const response = await apiClient.get(`/roles/${roleId}/permissions`);
    return response.data;
  }
  ,
  updateRolePermissions: async (roleId: any, data: any) => {
    const response = await apiClient.post(`/roles/update/${roleId}/permissions`, data);
    return response.data;
  },
  fetchIgotRoles: async () => {
    const response = await apiClient.get("/roles/orgTypeList");
    return response.data;
  }
};
