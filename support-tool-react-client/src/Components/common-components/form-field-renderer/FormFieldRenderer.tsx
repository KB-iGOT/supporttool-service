import React from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { FieldDefinition } from '../../../types/forms';

interface FormFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
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
}) => {
  if (field.fieldType === 'text') {
    return (
      <TextField
        fullWidth
        label={field.displayName}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={!field.optional}
        error={!!error}
        helperText={error}
        margin="normal"
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
          required={!field.optional}
          label={field.displayName}
        >
          {mockDropdownOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    );
  }

  return null;
};