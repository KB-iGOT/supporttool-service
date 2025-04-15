export interface Environment {
    apiBaseUrl: string;
    environment: string;
    isProduction: boolean;
    isDevelopment: boolean;
  }
  
  debugger
  const env: Environment = {
    
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
    environment: process.env.REACT_APP_ENV || 'development',
    isProduction: process.env.REACT_APP_ENV === 'production',
    isDevelopment: process.env.REACT_APP_ENV === 'development',
  };
  
  export default env;
  