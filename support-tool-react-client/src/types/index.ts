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

export type appContextType = {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    isLoggedIn: boolean;
    setIsLoggedIn: (loading: boolean) => void;
    user: IUserConfig | null;
    notification: INotification;
    setNotification: React.Dispatch<React.SetStateAction<INotification>>;
}