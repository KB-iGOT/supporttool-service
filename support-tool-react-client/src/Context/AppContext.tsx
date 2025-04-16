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
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
      const storedValue = localStorage.getItem('isLoggedIn');
      return storedValue ? JSON.parse(storedValue) : false;
    });

    const updateIsLoggedIn = (value: boolean) => {
      setIsLoggedIn(value);
      localStorage.setItem('isLoggedIn', JSON.stringify(value));
    };

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        isLoggedIn,
        setIsLoggedIn: updateIsLoggedIn
      }}
    >
      {children}
    </AppContext.Provider>
  );
};