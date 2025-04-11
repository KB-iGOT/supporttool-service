import React, {
    createContext,
    ReactNode,
        useState,
  } from 'react';
import { appContextType } from '../types';
  
  export const AppContext = createContext<appContextType | undefined>(
    undefined,
  );
  
  export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);   

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        isLoggedIn,
        setIsLoggedIn
      }}
    >
      {children}
    </AppContext.Provider>
  );
};