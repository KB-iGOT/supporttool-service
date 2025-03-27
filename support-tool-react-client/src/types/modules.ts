export interface Module {
    id?: number;
    name: string;
    url: string;
    isVisible: boolean;
    roles: string[];
    isAdminModule: boolean;
    isRootModule: boolean;
  }