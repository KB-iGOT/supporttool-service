export interface Environment {
  apiBaseUrl: string;
  environment: string;
  isProduction: boolean;
  isDevelopment: boolean;
  nonLoggedInBaseUrl: string;
  nonLoggedInBucketName: string;
  rolesList: string[];
}

// Extend Window interface to include runtime config
declare global {
  interface Window {
    _env_?: {
      REACT_APP_API_BASE_URL?: string;
      REACT_APP_ENV?: string;
      REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE?: string;
      REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE?: string;
      REACT_APP_ROLES_LIST?: string[];
    };
  }
}

// Helpers — read window._env_ at call time (not at module init)
const getStr = (key: keyof NonNullable<typeof window._env_>, fallback: string): string => {
  const v = window._env_?.[key];
  return (typeof v === 'string' ? v : undefined) || fallback;
};

const getEnvName = (): string =>
  getStr('REACT_APP_ENV', process.env.REACT_APP_ENV || 'development');

const getRolesList = (): string[] => {
  if (Array.isArray(window._env_?.REACT_APP_ROLES_LIST)) {
    return window._env_!.REACT_APP_ROLES_LIST!;
  }
  if (process.env.REACT_APP_ROLES_LIST) {
    try { return JSON.parse(process.env.REACT_APP_ROLES_LIST); } catch { /* fall through */ }
  }
  return [];
};

// Proxy: every property is computed from window._env_ at the time it is accessed,
// so it is always up-to-date even if window._env_ was set after this module was imported.
const env: Environment = new Proxy({} as Environment, {
  get(_t, prop: string): unknown {
    switch (prop as keyof Environment) {
      case 'apiBaseUrl':
        return getStr('REACT_APP_API_BASE_URL', process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api');
      case 'environment':
        return getEnvName();
      case 'isProduction':
        return getEnvName() === 'production';
      case 'isDevelopment':
        return getEnvName() === 'development';
      case 'nonLoggedInBaseUrl':
        return getStr('REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE', process.env.REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE || 'https://uat.karmayogibharat.net/');
      case 'nonLoggedInBucketName':
        return getStr('REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE', process.env.REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE || 'content-store');
      case 'rolesList':
        return getRolesList();
      default:
        return undefined;
    }
  },
});

export default env;
