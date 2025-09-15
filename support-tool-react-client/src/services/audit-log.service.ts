import axios from "axios";
import env from "../Config/env";
import { getCookie } from "../utils";
import { AuditLogFilters, AuditLogResponse } from "../types/audit-logs";

const API_BASE_URL = env.apiBaseUrl;
const userId = getCookie('userId');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId ?? '',
  },
});

export const auditLogService = {
  // Fetch audit logs with filters and pagination
  getAuditLogs: async (
    page: number = 1,
    limit: number = 10,
    filters: AuditLogFilters = {}
  ): Promise<AuditLogResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/audit-logs?${params.toString()}`);
    return response.data;
  },

  // Get audit log by ID
  getAuditLogById: async (id: string) => {
    const response = await apiClient.get(`/audit-logs/${id}`);
    return response.data;
  },

  // Get available modules for filter dropdown
  getModules: async () => {
    const response = await apiClient.get("/audit-logs/modules");
    return response.data;
  },

  // Get available actions for filter dropdown
  getActions: async () => {
    const response = await apiClient.get("/audit-logs/actions");
    return response.data;
  },

  // Export audit logs
  exportAuditLogs: async (filters: AuditLogFilters = {}): Promise<any> => {
    const params = new URLSearchParams();

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/audit-logs/export?${params.toString()}`, {
      responseType: 'blob', // Important for file downloads
    });
    return response.data;
  },
};
