export interface Module {
    id?: number;
    name: string;
    url: string;
    icon?: string;
    isVisible: boolean;
    roles: string[];
    isAdminModule: boolean;
    isRootModule: boolean;
    root?: string;
  }