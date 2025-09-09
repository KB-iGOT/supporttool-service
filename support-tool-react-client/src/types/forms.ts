export interface FieldDefinition {
  identifier: string;
  name: string;
  displayName: string;
  fieldType: 'text' | 'email' | 'tel' | 'number' | 'password' | 'dropdown' | 'select';
  optional: boolean;
  selected: boolean;
  order: number;
  placeholder?: string;
  description?: string; // New field for helper text
  fieldPath?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[];
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

export interface Facet {
  name: string;
  values: { name: string; count: number }[];
}