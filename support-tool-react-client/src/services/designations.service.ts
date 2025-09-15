import axios from "axios";
import env from "../Config/env";
import { getCookie } from "../utils";

const API_BASE_URL = env.apiBaseUrl;
const userId = getCookie("userId");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId ?? "",
  },
});

const searchMasterDesignations = async (query: string, pageNumber: number, pageSize: number) => {
  const requestData: any = {
    pageNumber,
    pageSize,
    filterCriteriaMap: {
      status: "Active"
    },
    requestedFields: []
  };

  if (query) {
    requestData.searchString = query;
  }
  const response = await apiClient.post('/designation/search', requestData);
  return response.data;
};

const createDesignationTerm = async (payload: any) => {
  try {
    const response = await apiClient.post('/designation/v1/term/create', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating designation term:', error);
    throw error;
  }
};

const importDesignations = async (payload: any) => {
  try {
    const response = await apiClient.post('/designation/v1/import', payload);
    return response.data;
  } catch (error) {
    console.error('Error importing designations:', error);
    throw error;
  }
};

const createDesignation = async (payload: any) => {
  try {
    const response = await apiClient.post('/designation/create/term', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating designation:', error);
    throw error;
  }
};


const searchOrgDesignations = async (query: string, frameworkId: string, limit: number = 50, offset: number = 0) => {
  const url = `${process.env.REACT_APP_BASE_URL}/api/composite/v4/search`;
  const request = {
    request: {
      filters: {
        status: "Live",
        category: "designation",
        "associations.identifier": frameworkId,
        objectType: "Term"
      },
      fields: ["name", "identifier"],
      offset: offset,
      limit: limit,
      sort_by: {
        name: "asc"
      }
    }
  };
  if (query) {
    (request.request.filters as any).name = { "startsWith": query };
  }
  const response = await axios.post(url, request);
  return response.data;
}

const uploadMasterDesignations = async (file: File, auditData: any) => {
  const formData = new FormData();
  formData.append('file', file);

  // Append audit data as a JSON string. The backend will parse this.
  formData.append('auditData', JSON.stringify(auditData));

  const response = await apiClient.post('/designation/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};


export const designationService = { searchMasterDesignations, createDesignationTerm, importDesignations, createDesignation, searchOrgDesignations, uploadMasterDesignations };