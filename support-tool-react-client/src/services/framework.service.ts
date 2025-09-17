import apiClient from "./apiClient";

const fetchFrameworkData = async (frameworkId: string) => {
  try {
    const response = await apiClient.get(`/framework/v1/read/${frameworkId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching framework data:', error);
    throw error;
  }
};

const updateTermAssociations = async (frameworkId: string, termId: string, category: string, associations: any[], auditData: any) => {
  try {
    const response = await apiClient.patch(`/framework/v1/term/update/${termId}?framework=${frameworkId}&category=${category}`, {
      requestPayload:{
        request: {
            term: {
            associations,
            },
        }
      },
      ...auditData,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating term associations:', error);
    throw error;
  }
};

const updateTermAssociationsV2 = async (frameworkId: string, termId: string, category: string,  newAssociations: any[], auditData: any) => {
  try {
    const response = await apiClient.patch(`/framework/v2/term/update/${termId}?frameworkId=${frameworkId}&category=${category}`, {
      newAssociations,
      ...auditData,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating term associations v2:', error);
    throw error;
  }
};

const publishFramework = async (frameworkId: string, auditData: any) => {
  try {
    // The body needs to include orgId for the X-Channel-Id header on the backend
    const response = await apiClient.post(`/framework/v1/publish/${frameworkId}`, {
      ...auditData,
      // orgId is already in auditData from the interceptor in ImportDesignationsPage
    });
    return response.data;
  } catch (error) {
    console.error('Error publishing framework:', error);
    throw error;
  }
};

export const frameworkService = {
  fetchFrameworkData,
  updateTermAssociations,
  updateTermAssociationsV2,
  publishFramework,
};