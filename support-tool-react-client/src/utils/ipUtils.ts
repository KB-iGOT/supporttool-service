const IP_STORAGE_KEY = 'clientIp';

export const storeClientIp = (ip: string): void => {
  if (ip) {
    localStorage.setItem(IP_STORAGE_KEY, ip);
  }
};

export const getStoredClientIp = (): string | null => {
  return localStorage.getItem(IP_STORAGE_KEY);
};

export const clearStoredClientIp = (): void => {
  localStorage.removeItem(IP_STORAGE_KEY);
};
