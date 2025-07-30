export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type BodyFormat = 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';

export interface Header {
  key: string;
  value: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
}

export interface ApiRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: any;
}