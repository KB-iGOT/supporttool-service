export interface FieldDefinition {
    identifier: string;
    name: string;
    displayName: string;
    fieldType: 'text' | 'dropdown';
    optional: boolean;
    selected: boolean;
    order: number;
    fieldPath?: string;

  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    errorMessage?: string;
  };
  }
  
  export interface FormData {
    [key: string]: any;
  }

  export interface ValidationError {
    message: string;
    type: 'required' | 'minLength' | 'maxLength' | 'pattern';
  }