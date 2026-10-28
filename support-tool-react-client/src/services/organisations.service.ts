import apiClient from "./apiClient";

// API Service for Modules
export const organisationService = {
  // Fetch all Modules
  fetchOrganisations: async (request: any) => {
    const response = await apiClient.post(`/org`, request);
    return response.data;
  },
  fetchOrganisationsData: async (request:any) => {
    const response = await apiClient.post(`/org/search`, request);
    return response.data;
  },
  /**
   * Looks up the root (tenant) organisation of each channel.
   * @param channels Channel names, e.g. from a bulk upload CSV
   * @returns Organisation identifiers keyed by lower-cased channel name
   */
  fetchOrgIdsByChannel: async (channels: string[]): Promise<Map<string, string>> => {
    const orgIdsByChannel = new Map<string, string>();
    const uniqueChannels = Array.from(new Set(channels.map((channel) => channel?.trim()).filter(Boolean)));
    if (uniqueChannels.length === 0) return orgIdsByChannel;

    const response = await apiClient.post(`/org/search`, {
      request: {
        filters: { channel: uniqueChannels, isTenant: true, status: 1 },
        fields: ["identifier", "channel"],
        limit: uniqueChannels.length,
      },
    });
    const orgs: { identifier: string; channel: string }[] = response.data?.result?.response?.content || [];
    orgs.forEach((org) => orgIdsByChannel.set(org.channel.toLowerCase(), org.identifier));
    return orgIdsByChannel;
  },
  fetchOrganisationByName: async (orgName:string) => {
    
    const response = await apiClient.get(`/org/`+ orgName);
    return response.data;
  },

  deleteOrganisationById: async (orgId:number) => {
    
    const response = await apiClient.get(`/org/delete/`+ orgId);
    return response.data;
  },

  updateOrganisationStatus: async (request: any) => {
    const response = await apiClient.patch(`/org/status/update`, request);
    return response.data;
  }
};
