/**
 * Service to detect and manage client IP address
 * Uses ipify.org API to get the actual public IP
 */

const IP_STORAGE_KEY = 'clientIp';
const IP_DETECTION_API = 'https://api.ipify.org?format=json';

/**
 * Fetch the actual client IP address from ipify API
 * This gets the real public IP of the client
 */
export const fetchClientIp = async (): Promise<string | null> => {
  try {
    const response = await fetch(IP_DETECTION_API, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('IP detection API returned status:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (data.ip && typeof data.ip === 'string') {
      return data.ip;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching client IP:', error);
    return null;
  }
};

/**
 * Get or fetch the client IP address
 * Returns cached IP if available, otherwise fetches fresh IP
 */
export const getClientIp = async (): Promise<string | null> => {
  // First check if we have a cached IP
  const cachedIp = localStorage.getItem(IP_STORAGE_KEY);
  if (cachedIp && cachedIp !== '::1' && cachedIp !== '127.0.0.1') {
    return cachedIp;
  }
  
  // If no valid cached IP, fetch a fresh one
  const freshIp = await fetchClientIp();
  if (freshIp) {
    storeClientIp(freshIp);
  }
  return freshIp;
};

/**
 * Store the client IP in localStorage
 */
export const storeClientIp = (ip: string): void => {
  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    localStorage.setItem(IP_STORAGE_KEY, ip);
  }
};

/**
 * Get stored IP without fetching
 */
export const getStoredClientIp = (): string | null => {
  return localStorage.getItem(IP_STORAGE_KEY);
};

/**
 * Clear the stored IP
 */
export const clearStoredClientIp = (): void => {
  localStorage.removeItem(IP_STORAGE_KEY);
};
