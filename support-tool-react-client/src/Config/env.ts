// Declare window.env for TypeScript
declare global {
  interface Window {
    env: {
      REACT_APP_API_BASE_URL?: string;
      REACT_APP_ENV?: string;
      REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE?: string;
      REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE?: string;
      REACT_APP_ROLES_LIST?: string;
    };
  }
}

// Get config from window.env (runtime) with fallbacks
const getEnvVar = (key: keyof Window['env'], fallback: string = ''): string => {
  return window.env?.[key] || fallback;
};

export interface Environment {
  apiBaseUrl: string;
  environment: string;
  isProduction: boolean;
  isDevelopment: boolean;
  nonLoggedInBaseUrl: string;
  nonLoggedInBucketName: string;
  rolesList: string[];
}

const env: Environment = {
  apiBaseUrl: getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:5000/api'),
  environment: getEnvVar('REACT_APP_ENV', 'development'),
  isProduction: getEnvVar('REACT_APP_ENV', 'development') === 'production',
  isDevelopment: getEnvVar('REACT_APP_ENV', 'development') === 'development',
  nonLoggedInBaseUrl: getEnvVar('REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE', 'https://uat.karmayogibharat.net/'),
  nonLoggedInBucketName: getEnvVar('REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE', 'content-store'),
  rolesList: getEnvVar('REACT_APP_ROLES_LIST', '').split(',').filter(Boolean).sort()
};

export default env;
