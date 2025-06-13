import React, {
  createContext,
  ReactNode,
  useState,
  useEffect
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
  const [userRoles, setUserRoles] = useState<any | []>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  // Define the setUserFromCookie function
  const setUserFromCookie = (value: boolean) => {
    if (value) {
      const userData = getCookie('user');
      if (userData) {
        
        let userDecodedData = decodeCookie(userData)
        
        if(userDecodedData && userDecodedData.roles){
          setUserRoles(userDecodedData.roles);
        }
        setUser(userDecodedData);
      }
    } else {
      setUser(null);
    }
  };

  // Update isLoggedIn state and user data
  const updateIsLoggedIn = (value: boolean) => {
    setIsLoggedIn(value);
    setUserFromCookie(value);
    localStorage.setItem('isLoggedIn', JSON.stringify(value));
  };

  // Initialize user data from cookie when component mounts
  useEffect(() => {
    setUserFromCookie(isLoggedIn);
  }, [isLoggedIn]);

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        isLoggedIn,
        setIsLoggedIn: updateIsLoggedIn,
        user,
        userRoles,
        notification,
        setNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};