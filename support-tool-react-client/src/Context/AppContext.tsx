import React, {
  createContext,
  ReactNode,
  useState,
  useEffect,
  useContext,
  useCallback
} from 'react';
import { ActionPayload, appContextType, IUserConfig, Module } from '../types/index';
import { decodeCookie, getCookie } from '../utils';
import { authService } from '../services/authentication.service';
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
  const [modulePermissions, setModulePermissions] = useState<Record<string, any>>({});
  const [modules, setModules] = useState<{ user: Module[]; admin: Module[] }>({
    user: [],
    admin: [],
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionPayload | null>(null);
  const [currentHandler, setCurrentHandler] = useState<((data: any) => void) | null>(null);

  const fetchModules = useCallback(async () => {
    if (!isLoggedIn) {
      setModules({ user: [], admin: [] });
      return;
    }
    setLoading(true);
    try {
      // Dynamically import to avoid circular dependencies if dashboardService uses AppContext
      const { dashboardService } = await import('../services/dashboard.service');
      const response = await dashboardService.getModules();
      if (response && response.status === 200) {
        setModules({
          user: response.modules || [],
          admin: response.adminModules || [],
        });
      } else {
        setModules({ user: [], admin: [] });
      }
    } catch (error) {
      console.error("Error fetching sidebar modules:", error);
      setModules({ user: [], admin: [] });
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchCurrentUser = useCallback(async () => {
    if (!isLoggedIn) {
      setUser(null);
      setModulePermissions({});
      return;
    }
    try {
      const response = await authService.getCurrentUserSession();
      if (response && response.data) {
        const userSessionData = response.data;
        if (userSessionData && userSessionData.rolePermissions) {
          userSessionData['userId'] = userSessionData.id ||''
          const permissionsMap: Record<string, any> = {};
          userSessionData.rolePermissions.forEach((permission: any) => {
            permissionsMap[permission.module_url] = permission;
          });
          setModulePermissions(permissionsMap);
        }
        setUser(userSessionData);
      }
    } catch (error) {
      console.error("Error fetching user session:", error);
      setUser(null);
      setModulePermissions({});
    }
  }, [isLoggedIn]);

  // Update isLoggedIn state and user data
  const updateIsLoggedIn = (value: boolean) => {
    setIsLoggedIn(value);
    localStorage.setItem('isLoggedIn', JSON.stringify(value));
  };

  useEffect(() => {
    if (isLoggedIn && !user?.rolePermissions) { // Only fetch if logged in but user data is not present
      fetchCurrentUser();
    }
    if (isLoggedIn) {
      fetchModules();
    }
  }, [isLoggedIn, user, fetchCurrentUser, fetchModules]);

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
        setUser,
        setModulePermissions,
        modulePermissions,
        modules,
        fetchModules,
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