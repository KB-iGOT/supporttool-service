export interface AuditLog {
  id: string;
  userId: string;
  module: string;
  subModule: string;
  action: string;
  entityId: string;
  requestPayload: string | object | null;
  modifiedPayload: string | object | null;
  responsePayload: string | object | null;
  ipAddress: string;
  userAgent: string;
  status: string;
  message?: string;
  createdAt: string;
  jiraLink?: string;
}

export interface AuditLogFilters {
  module?: string;
  subModule?: string;
  action?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  entityId?: string;
  userId?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
