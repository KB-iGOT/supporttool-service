export interface INotification {
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }

  export interface IUserConfig {
        userId: string;
        userName?: string;
        name: string;
        token?: string;
  }

  export interface ActionPayload {
  type: string;
  payload: any;
}

export type appContextType = {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    isLoggedIn: boolean;
    setIsLoggedIn: (loading: boolean) => void;
    user: IUserConfig | null;
    userRoles: any | [];
    notification: INotification;
    modulePermissions: any;
    setNotification: React.Dispatch<React.SetStateAction<INotification>>;
    checkPermissions: (path?: string) => {
      canRead: boolean;
      canWrite: boolean;
      canDelete: boolean;
      permissions: any;
      basePath: string;
    };
      interceptAction: (
    actionType: string,
    payload: any,
    onComplete: (enhancedPayload: any) => void
  ) => void;
  isIntercepting: boolean;
  currentAction: ActionPayload | null;
  currentHandler: ((data: any) => void) | null;
  completeAction: (jiraLink: string) => void;
  cancelAction: () => void;
}

