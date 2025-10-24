import axios from "axios";
import apiClient from "./apiClient";
import env from "../Config/env";

const searchMasterDesignations = async (query: string, pageNumber: number, pageSize: number, status: string) => {
  const requestData: any = {
    pageNumber,
    pageSize,
    filterCriteriaMap: {status

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
  const categoryIdentifier = `${frameworkId}_odcs_designation`;
  const request = {
    request: {
      filters: {
        status: "Live",
        category: "designation",
        categories: [categoryIdentifier],
        objectType: "Term"
      },
      fields: ["name", "identifier"],
      offset: offset,
      limit: limit,
      sort_by: {
        lastUpdatedOn: "desc",
        objectType: "Term"
      },
      facets: []
    }
  };

  if (query) {
    (request.request.filters as any).name = { "startsWith": query };
  }
  const response = await apiClient.post('/designation/composite/search', request);
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

const deleteDesignation = async (id: string, auditData: any) => {
  try {
    // The audit data (jiraLink, module) is sent in the body for DELETE requests
    const response = await apiClient.delete(`/designation/delete/${id}`, { data: auditData });
    return response.data;
  } catch (error) {
    console.error('Error deleting designation:', error);
    throw error;
  }
};

const updateDesignation = async (payload: any, auditData: any) => {
  try {
    const finalPayload = {
      requestPayload: payload,
      ...auditData,
    };
    const response = await apiClient.put('/designation/update', finalPayload);
    return response.data;
  } catch (error) {
    console.error('Error updating designation:', error);
    throw error;
  }
};


export const designationService = { searchMasterDesignations, createDesignationTerm, importDesignations, createDesignation, searchOrgDesignations, uploadMasterDesignations, deleteDesignation, updateDesignation };