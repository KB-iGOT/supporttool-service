export interface Environment {
    apiBaseUrl: string;
    environment: string;
    isProduction: boolean;
    isDevelopment: boolean;
    nonLoggedInBaseUrl: string;
    nonLoggedInBucketName: string;
    rolesList: string;
  }
  
  // Extend Window interface to include runtime config
  declare global {
    interface Window {
      _env_?: {
        REACT_APP_API_BASE_URL?: string;
        REACT_APP_ENV?: string;
        REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE?: string;
        REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE?: string;
        REACT_APP_ROLES_LIST?: string;
      };
    }
  }
  
  // Helper function to get environment variable with runtime config override
  const getEnvVar = (runtimeKey: keyof NonNullable<typeof window._env_>, buildTimeValue: string): string => {
    // Priority: Runtime config (from env-config.js) > Build-time env variables
    return window._env_?.[runtimeKey] || buildTimeValue;
  };
  
  const env: Environment = {
    apiBaseUrl: getEnvVar('REACT_APP_API_BASE_URL', process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'),
    environment: getEnvVar('REACT_APP_ENV', process.env.REACT_APP_ENV || 'development'),
    isProduction: getEnvVar('REACT_APP_ENV', process.env.REACT_APP_ENV || 'development') === 'production',
    isDevelopment: getEnvVar('REACT_APP_ENV', process.env.REACT_APP_ENV || 'development') === 'development',
    nonLoggedInBaseUrl: getEnvVar('REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE', process.env.REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE || 'https://uat.karmayogibharat.net/'),
    nonLoggedInBucketName: getEnvVar('REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE', process.env.REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE || 'content-store'),
    rolesList: getEnvVar('REACT_APP_ROLES_LIST', process.env.REACT_APP_ROLES_LIST || '')
  };
  
  export default env;
  