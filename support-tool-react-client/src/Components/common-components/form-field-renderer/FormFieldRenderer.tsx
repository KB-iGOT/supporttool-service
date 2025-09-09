import React from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { FieldDefinition } from '../../../types/forms';

interface FormFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  onBlur?: () => void;
}

const mockDropdownOptions = [
  { value: 'NOT-VERIFIED', label: 'Not Verified' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PENDING', label: 'Pending' }
];

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  onBlur,
}) => {
  // Handle text, email, tel, number, password, and other text-based input types
  if (field.fieldType === 'text' || 
      field.fieldType === 'email' || 
      field.fieldType === 'tel' || 
      field.fieldType === 'number' || 
      field.fieldType === 'password') {
    
    return (
      <TextField
        fullWidth
        label={field.displayName}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur} // Make sure this is here
        required={!field.optional}
        error={!!error}
        helperText={error || field.description || ''}
        margin="normal"
        type={field.fieldType} // Use the field type for the input type
        placeholder={field.placeholder}
        // If there's validation pattern, apply it
        inputProps={{
          pattern: field.validation?.pattern,
          minLength: field.validation?.minLength,
          maxLength: field.validation?.maxLength,
        }}
      />
    );
  }

  if (field.fieldType === 'dropdown') {
    return (
      <FormControl fullWidth margin="normal" error={!!error}>
        <InputLabel id={`${field.identifier}-label`}>{field.displayName}</InputLabel>
        <Select
          labelId={`${field.identifier}-label`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          required={!field.optional}
          label={field.displayName}
        >
          {mockDropdownOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{error || field.description || field.placeholder}</FormHelperText>
      </FormControl>
    );
  }

  // Return a warning message for unsupported field types in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Unsupported field type: ${field.fieldType} for field: ${field.identifier}`);
  }
  return null;
};