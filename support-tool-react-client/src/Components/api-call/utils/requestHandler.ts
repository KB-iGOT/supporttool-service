import { ApiRequest, ApiResponse, Header, BodyFormat } from './types';
import { apiCallService } from '../../../services/api-call.service';

export const formatJSON = (json: any): string => {
  try {
    return JSON.stringify(json, null, 2);
  } catch (err) {
    return String(json);
  }
};

export const isJsonResponse = (response: ApiResponse | null): boolean => {
  if (!response) return false;
  
  try {
    return typeof response.data === 'object';
  } catch (err) {
    return false;
  }
};

export const prepareRequestBody = (
  bodyContent: string, 
  bodyFormat: BodyFormat
): any | null => {
  if (!bodyContent) return null;
  
  try {
    if (bodyFormat === 'json') {
      return JSON.parse(bodyContent);
    } else if (bodyFormat === 'form-data') {
      // For form-data, we convert to an object
      return JSON.parse(bodyContent);
    } else {
      // Raw text or url-encoded
      return bodyContent;
    }
  } catch (e) {
    throw new Error(`Invalid ${bodyFormat} format in request body`);
  }
};

export const prepareHeaders = (
  headers: Header[], 
  method: string, 
  bodyFormat: BodyFormat
): Record<string, string> => {
  const headerObj: Record<string, string> = {};
  
  // Collect all headers
  headers.forEach(header => {
    if (header.key.trim()) {
      if (header.key.endsWith(';')) {
        const cleanKey = header.key.slice(0, -1).trim();
        headerObj[cleanKey] = '';
      } else {
        headerObj[header.key] = header.value;
      }
    }
  });
  
  // Add Content-Type based on body format if not present
  if (method !== 'GET' && method !== 'HEAD' && !headerObj['Content-Type'] && bodyFormat !== 'form-data') {
    if (bodyFormat === 'json') {
      headerObj['Content-Type'] = 'application/json';
    } else if (bodyFormat === 'x-www-form-urlencoded') {
      headerObj['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      headerObj['Content-Type'] = 'text/plain';
    }
  }
  
  // Remove Content-Type for form-data
  if (bodyFormat === 'form-data' && headerObj['Content-Type']) {
    delete headerObj['Content-Type'];
  }
  
  return headerObj;
};

export const sendApiRequest = async (
  url: string,
  method: string,
  headers: Header[],
  bodyContent: string,
  bodyFormat: BodyFormat
): Promise<ApiResponse> => {
  // Prepare headers
  const headerObj = prepareHeaders(headers, method, bodyFormat);
  
  // Prepare the body if needed
  let requestBody: any = null;
  
  if (method !== 'GET' && method !== 'HEAD' && bodyContent) {
    requestBody = prepareRequestBody(bodyContent, bodyFormat);
  }
  
  // Measure response time
  const startTime = performance.now();
  
  // Make the API call
  const response = await apiCallService.proxyApiCall({
    url,
    method,
    headers: headerObj,
    body: requestBody
  });
  
  const endTime = performance.now();
  
  // Return formatted response
  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers || {},
    data: response.data,
    time: Math.round(endTime - startTime)
  };
};