import React, {
  createContext,
  ReactNode,
  useState,
  useEffect,
  useContext
} from 'react';
import { ActionPayload, appContextType, IUserConfig } from '../types';
import { decodeCookie, getCookie } from '../utils';
import { checkModulePermission } from './../utils/permissionUtils';

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
  const [modulePermissions, setModulePermissions] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionPayload | null>(null);
  const [currentHandler, setCurrentHandler] = useState<((data: any) => void) | null>(null);

  // Define the setUserFromCookie function
  const setUserFromCookie = (value: boolean) => {
    if (value) {
      const userData = getCookie('user');
      
      if (userData) {
        
        let userDecodedData = decodeCookie(userData);
        if (userDecodedData && userDecodedData?.rolePermissions) {
          
          // Transform the rolePermissions array into an object with module_url as keys
          const permissionsMap: Record<string, any> = {};
          userDecodedData.rolePermissions.forEach((permission: any) => {
            const moduleUrl = permission.module_url;
            // If this module URL is already in the map
            if (permissionsMap[moduleUrl]) {
              // Update permissions only if the new permission provides more access
              permissionsMap[moduleUrl] = {
                ...permissionsMap[moduleUrl],
                can_read: permissionsMap[moduleUrl].can_read || permission.can_read,
                can_write: permissionsMap[moduleUrl].can_write || permission.can_write,
                can_delete: permissionsMap[moduleUrl].can_delete || permission.can_delete
              };
            } else {
              // First time seeing this module URL, just add it
              permissionsMap[moduleUrl] = permission;
            }
          });
          setModulePermissions(permissionsMap);
        }
        
        if (userDecodedData && userDecodedData.roles) {
          setUserRoles(userDecodedData.roles);
        }
        setUser(userDecodedData);
      }
    } else {
      setUser(null);
      setModulePermissions({});
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

  // Module permission check function that can be used anywhere
  const checkPermissions = (path?: string) => {
    
    const currentPath = path || window.location.pathname;
    return checkModulePermission(modulePermissions, currentPath);
  };

  const interceptAction = (
    actionType: string,
    payload: any,
    onComplete: (data: any) => void
  ) => {
    setCurrentAction({ type: actionType, payload });
    setCurrentHandler(() => onComplete);
    setIsIntercepting(true);
  };

  const completeAction = (jiraLink: string) => {
    if (currentAction && currentHandler) {
      const enhancedPayload = {
        ...currentAction.payload,
        jiraLink
      };
      currentHandler(enhancedPayload);
    }
    resetState();
  };

  const cancelAction = () => {
    resetState();
  };

  const resetState = () => {
    setIsIntercepting(false);
    setCurrentAction(null);
    setCurrentHandler(null);
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        isLoggedIn,
        setIsLoggedIn: updateIsLoggedIn,
        user,
        userRoles,
        modulePermissions,
        notification,
        setNotification,
        checkPermissions, 
        interceptAction,
        isIntercepting,
        currentAction,
        currentHandler,
        completeAction,
        cancelAction
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useActionIntercept = (): appContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useActionIntercept must be used within an ActionInterceptProvider');
  }
  return context;
};