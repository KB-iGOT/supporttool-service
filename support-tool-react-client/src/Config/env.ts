export interface Environment {
    apiBaseUrl: string;
    environment: string;
    isProduction: boolean;
    isDevelopment: boolean;
    nonLoggedInBaseUrl: string;
    nonLoggedInBucketName: string;
  }
  
  const env: Environment = {
    
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
    environment: process.env.REACT_APP_ENV || 'development',
    isProduction: process.env.REACT_APP_ENV === 'production',
    isDevelopment: process.env.REACT_APP_ENV === 'development',
    nonLoggedInBaseUrl: process.env.REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE || 'https://uat.karmayogibharat.net/',
    nonLoggedInBucketName: process.env.REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE || 'content-store'
  };
  
  export default env;
  