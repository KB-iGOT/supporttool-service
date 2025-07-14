export interface FieldDefinition {
    identifier: string;
    name: string;
    displayName: string;
    fieldType: "text" | "dropdown" | "email" | "tel"|"number" | "password" | "textarea"| "select";
    optional: boolean;
    selected?: boolean;
    order?: number;
    fieldPath?: string;
    placeholder: string;
    defaultValue?: string | string[];
    validation?: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      errorMessage?: string;
    };
    options?: {
      label: string;
      value: string;
    }[];
  }
  
  export interface FormData {
    [key: string]: any;
  }

  export interface ValidationError {
    message: string;
    type: 'required' | 'minLength' | 'maxLength' | 'pattern';
  }
