import { AuroraOverview, AuroraOverviewParams } from "../Components/aurora-dashboard/aurora.model";
import apiClient from "./apiClient";

export const auroraService = {
  getDashboardOverview: async (params: AuroraOverviewParams = {}): Promise<AuroraOverview> => {
    const response = await apiClient.get("/aurora/dashboard/overview", { params });
    return response.data;
  },
};
