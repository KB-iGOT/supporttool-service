import React, {
    createContext,
    ReactNode,
    useEffect,
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

    useEffect(()=> {
        console.log(window.location.pathname, window.location.pathname.includes('/login'));
        setIsLoggedIn(!window.location.pathname.includes('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[window.location.pathname])

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        isLoggedIn
      }}
    >
      {children}
    </AppContext.Provider>
  );
};