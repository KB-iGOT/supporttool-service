import { HttpMethod, Header, BodyFormat } from './types';

interface CurlParseResult {
  url?: string;
  method?: HttpMethod;
  headers: Header[];
  bodyData?: string;
  bodyFormat?: BodyFormat;
  error?: string;
}

export const parseCurlCommand = (curlCommand: string): CurlParseResult => {
  try {
    let cmd = curlCommand.trim();
    
    // Handle multi-line curl commands
    cmd = cmd.replace(/\\\s*\n\s*/g, ' ');
    
    if (!cmd.startsWith('curl')) {
      return { headers: [], error: 'Invalid cURL command. Command must start with "curl"' };
    }

    // Ignore the --location flag
    cmd = cmd.replace(/--location\s+/g, '');
    
    const result: CurlParseResult = { headers: [] };

    // Extract URL
    let urlMatch = cmd.match(/curl\s+(?:--location\s+)?['"]([^'"]+)['"]/);
    if (!urlMatch) {
      urlMatch = cmd.match(/curl\s+(?:--location\s+)?([^\s]+)/);
    }
    
    if (urlMatch && urlMatch[1]) {
      result.url = urlMatch[1];
    }

    // Check for data payloads
    const hasDataPayload = cmd.includes('-d ') || 
                          cmd.includes('--data ') || 
                          cmd.includes('--data-raw ');

    // Extract method explicitly defined with -X flag - IMPROVED REGEX
    const methodMatch = cmd.match(/-X\s+(?:['"]([A-Z]+)['"]|([A-Z]+))/i);
    
    if (methodMatch && (methodMatch[1] || methodMatch[2])) {
      // If method is explicitly defined with -X flag, use it
      const explicitMethod = (methodMatch[1] || methodMatch[2]).toUpperCase();
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(explicitMethod)) {
        result.method = explicitMethod as HttpMethod;
      } else {
        // Fallback for unknown methods
        result.method = hasDataPayload ? 'POST' : 'GET';
      }
    } else {
      // No explicit method flag:
      // - Use POST for commands with data payloads
      // - Use GET for commands without data payloads
      result.method = hasDataPayload ? 'POST' : 'GET';
      
      // Special case: Check if the curl has a request method in the URL (like PUT or DELETE)
      if (cmd.toLowerCase().includes(' put ') || cmd.toLowerCase().includes(' put?')) {
        result.method = 'PUT';
      } else if (cmd.toLowerCase().includes(' delete ') || cmd.toLowerCase().includes(' delete?')) {
        result.method = 'DELETE';
      } else if (cmd.toLowerCase().includes(' patch ') || cmd.toLowerCase().includes(' patch?')) {
        result.method = 'PATCH';
      } else if (cmd.toLowerCase().includes(' options ') || cmd.toLowerCase().includes(' options?')) {
        result.method = 'OPTIONS';
      }
    }

    // Extract headers
    const extractedHeaders: Header[] = [];
    
    // Headers pattern
    const headerRegex = /(?:--header|-H)\s+(?:['"]([^'"]+)['"]|([^\s]+))/g;
    let headerMatch;
    
    while ((headerMatch = headerRegex.exec(cmd)) !== null) {
      const headerValue = headerMatch[1] || headerMatch[2];
      if (headerValue) {
        if (headerValue.endsWith(';')) {
          const key = headerValue.slice(0, -1).trim();
          extractedHeaders.push({ key, value: '' });
        } else if (headerValue.includes(':')) {
          const colonIndex = headerValue.indexOf(':');
          const key = headerValue.substring(0, colonIndex).trim();
          const value = headerValue.substring(colonIndex + 1).trim();
          extractedHeaders.push({ key, value });
        } else {
          extractedHeaders.push({ key: headerValue, value: '' });
        }
      }
    }
    
    // Extract cookies
    const cookieRegex = /(?:-b|--cookie)\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/;
    const cookieMatch = cmd.match(cookieRegex);
    
    if (cookieMatch && (cookieMatch[1] || cookieMatch[2] || cookieMatch[3])) {
      const cookieValue = cookieMatch[1] || cookieMatch[2] || cookieMatch[3];
      extractedHeaders.push({ key: 'Cookie', value: cookieValue });
    }
    
    result.headers = extractedHeaders;
    
    // Set body format based on content-type header
    const contentTypeHeader = extractedHeaders.find(h => h.key.toLowerCase() === 'content-type');
    if (contentTypeHeader) {
      if (contentTypeHeader.value.includes('application/json')) {
        result.bodyFormat = 'json';
      } else if (contentTypeHeader.value.includes('application/x-www-form-urlencoded')) {
        result.bodyFormat = 'x-www-form-urlencoded';
      } else if (contentTypeHeader.value.includes('multipart/form-data')) {
        result.bodyFormat = 'form-data';
      } else {
        result.bodyFormat = 'raw';
      }
    }

    // Extract body data
    // First try to find data-raw with quotes
    const dataRawRegex = /--data-raw\s+(['"])([\s\S]*?)\1(?:\s|$)/;
    const dataRawMatch = cmd.match(dataRawRegex);
    
    // Then try to find regular data with quotes
    const dataRegex = /(?:--data|-d)\s+(['"])([\s\S]*?)\1(?:\s|$)/;
    const dataMatch = cmd.match(dataRegex);
    
    if (dataRawMatch && dataRawMatch[2]) {
      result.bodyData = dataRawMatch[2];
    } else if (dataMatch && dataMatch[2]) {
      result.bodyData = dataMatch[2];
    } else {
      // If no quoted data is found, try to find unquoted JSON data
      // This regex looks for a JSON object or array after --data-raw, --data, or -d
      // Using [\s\S]* for cross-browser compatibility
      const unquotedDataRegex = /(?:--data-raw|--data|-d)\s+(\{[\s\S]*?\}|\[[\s\S]*?\])(?:\s|$)/;
      const unquotedDataMatch = cmd.match(unquotedDataRegex);
      
      if (unquotedDataMatch && unquotedDataMatch[1]) {
        result.bodyData = unquotedDataMatch[1];
      } else {
        // Try to find data without quotes and not JSON format (e.g., form data)
        const plainDataRegex = /(?:--data-raw|--data|-d)\s+([^\s'"]+)(?:\s|$)/;
        const plainDataMatch = cmd.match(plainDataRegex);
        
        if (plainDataMatch && plainDataMatch[1]) {
          result.bodyData = plainDataMatch[1];
        }
      }
    }
    
    // If we detected method and body data, ensure proper body format
    if (result.method && result.bodyData) {
      // For PUT/POST/PATCH with JSON-like data and no specific format,
      // default to JSON format
      if (['PUT', 'POST', 'PATCH'].includes(result.method) && 
          !result.bodyFormat &&
          ((result.bodyData.startsWith('{') && result.bodyData.endsWith('}')) || 
           (result.bodyData.startsWith('[') && result.bodyData.endsWith(']')))) {
        result.bodyFormat = 'json';
      } 
      // For form data (contains = but not JSON), default to x-www-form-urlencoded
      else if (!result.bodyFormat && result.bodyData.includes('=') && 
               !result.bodyData.includes('{') && !result.bodyData.includes('[')) {
        result.bodyFormat = 'x-www-form-urlencoded';
      }
      // Default to raw if we can't determine format
      else if (!result.bodyFormat) {
        result.bodyFormat = 'raw';
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing cURL command:', error);
    return { headers: [], error: 'Failed to parse cURL command' };
  }
};

export const formatBodyData = (bodyData: string | undefined, bodyFormat: BodyFormat | undefined): {
  formattedData: string;
  detectedFormat: BodyFormat;
} => {
  if (!bodyData) {
    return { formattedData: '{\n  "key": "value"\n}', detectedFormat: 'json' };
  }
  
  try {
    // Check if it looks like JSON
    if ((bodyData.startsWith('{') && bodyData.endsWith('}')) || 
        (bodyData.startsWith('[') && bodyData.endsWith(']'))) {
      // Try to parse and format the JSON
      try {
        const parsedBody = JSON.parse(bodyData);
        return { 
          formattedData: JSON.stringify(parsedBody, null, 2),
          detectedFormat: bodyFormat || 'json'
        };
      } catch (e) {
        console.error("Error parsing JSON body:", e);
        return { formattedData: bodyData, detectedFormat: bodyFormat || 'raw' };
      }
    } else {
      // Not JSON
      if (bodyData.includes('=') && !bodyData.includes('{')) {
        return { formattedData: bodyData, detectedFormat: bodyFormat || 'x-www-form-urlencoded' };
      } else {
        return { formattedData: bodyData, detectedFormat: bodyFormat || 'raw' };
      }
    }
  } catch (e) {
    return { formattedData: bodyData, detectedFormat: bodyFormat || 'raw' };
  }
};