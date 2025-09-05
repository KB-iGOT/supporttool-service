// Enhanced analytics service with flexible date range support
import apiClient from './apiClient';

export interface AnalyticsStats {
  totalUsers: number;
  activeUsers: number; 
  totalModules: number;
  activeModules: number;
  totalActions: number;
  recentActions: number;
  totalAuditLogs: number;
  recentAuditLogs: number;
  failedOperations: number;
  successfulOperations: number;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  timelineData: Array<{
    date: string;
    users: number;
    actions: number;
  }>;
  auditLogsTimeline: Array<{
    date: string;
    success: number;
    failure: number;
  }>;
  moduleActivity: Array<{
    module: string;
    count: number;
  }>;
  auditLogsByModule: Array<{
    module: string;
    count: number;
  }>;
  actionTypes: Array<{
    type: string;
    count: number;
  }>;
  auditLogsByAction: Array<{
    action: string;
    count: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  auditLogsByStatus: Array<{
    status: string;
    count: number;
  }>;
}

class AnalyticsService {
  async getAnalyticsStats(params: string | { startDate: Date; endDate: Date } = '7d'): Promise<AnalyticsStats> {
    try {
      let queryParams: any = {};
      
      // Handle both legacy string timeRange and new date range objects
      if (typeof params === 'string') {
        queryParams.timeRange = params;
      } else {
        queryParams.startDate = params.startDate.toISOString().split('T')[0];
        queryParams.endDate = params.endDate.toISOString().split('T')[0];
      }

      const response = await apiClient.get('/analytics/stats', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      throw error;
    }
  }

  async getTimelineData(params: string | { startDate: Date; endDate: Date } = '7d') {
    try {
      let queryParams: any = {};
      
      if (typeof params === 'string') {
        queryParams.timeRange = params;
      } else {
        queryParams.startDate = params.startDate.toISOString().split('T')[0];
        queryParams.endDate = params.endDate.toISOString().split('T')[0];
      }

      const response = await apiClient.get('/analytics/timeline', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      throw error;
    }
  }

  async getModuleActivity(params: string | { startDate: Date; endDate: Date } = '7d') {
    try {
      let queryParams: any = {};
      
      if (typeof params === 'string') {
        queryParams.timeRange = params;
      } else {
        queryParams.startDate = params.startDate.toISOString().split('T')[0];
        queryParams.endDate = params.endDate.toISOString().split('T')[0];
      }

      const response = await apiClient.get('/analytics/modules', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching module activity:', error);
      throw error;
    }
  }

  async getActionTypes(params: string | { startDate: Date; endDate: Date } = '7d') {
    try {
      let queryParams: any = {};
      
      if (typeof params === 'string') {
        queryParams.timeRange = params;
      } else {
        queryParams.startDate = params.startDate.toISOString().split('T')[0];
        queryParams.endDate = params.endDate.toISOString().split('T')[0];
      }

      const response = await apiClient.get('/analytics/actions', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching action types:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
