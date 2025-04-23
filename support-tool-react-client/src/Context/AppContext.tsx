import React, {
    createContext,
    ReactNode,
        useState,
  } from 'react';
import { appContextType, IUserConfig } from '../types';
import { decodeCookie, getCookie } from '../utils';
  
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
    const [user, setUser] = useState<IUserConfig | null>(null);
    const [notification, setNotification] = useState<{
      open: boolean;
      message: string;
      severity: "success" | "error" | "info";
    }>({ open: false, message: "", severity: "info" });

    const updateIsLoggedIn = (value: boolean) => {
      setIsLoggedIn(value);
      if (value) {
        const userData = getCookie('user');

        if (userData) {

          setUser(decodeCookie(userData));
        }
      }else{
        setUser(null);
      }
      localStorage.setItem('isLoggedIn', JSON.stringify(value));
    };

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        isLoggedIn,
        setIsLoggedIn: updateIsLoggedIn,
        user,
        notification,
        setNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};