import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { FormFieldRenderer } from '../form-field-renderer/FormFieldRenderer';
import { FieldDefinition, FormData } from '../../../types/forms';
import { getNestedValue, setNestedValue } from '../../../utils/pathResolver';

interface DynamicFormDialogProps {
  open: boolean;
  onClose: () => void;
  fields: FieldDefinition[];
  initialData: FormData;
  onSubmit: (data: FormData) => void;
  title?: string;
  submitButtonText?: string;
  onBackDropClose?: boolean; // If true, prevents closing on backdrop click
}

export const DynamicFormDialog: React.FC<DynamicFormDialogProps> = ({
  open,
  onClose,
  fields,
  initialData,
  onSubmit,
  title,
  submitButtonText,
  onBackDropClose
}) => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const newFormData = JSON.parse(JSON.stringify(initialData));
      setFormData(newFormData);
      // Reset errors when dialog opens
      setErrors({});
    }
  }, [initialData, open]);

  const handleFieldChange = (field: FieldDefinition, value: any) => {
    const newFormData = { ...formData };
    if (field.fieldPath) {
      setNestedValue(newFormData, field.fieldPath, value);
    } else {
      newFormData[field.identifier] = value;
    }
    setFormData(newFormData);

    // Clear error when field is changed
    if (errors[field.identifier]) {
      setErrors((prev) => ({ ...prev, [field.identifier]: '' }));
    }
  };

  const validateField = (field: FieldDefinition, value: any): string => {
    // Required field validation
    if (!field.optional && (!value || String(value).trim() === '')) {
      return `${field.displayName} is required`;
    }

    // Skip further validation if field is optional and empty
    if (field.optional && (!value || String(value).trim() === '')) {
      return '';
    }

    const validation = field.validation;
    if (validation) {
      // Min length validation
      if (validation.minLength && String(value).length < validation.minLength) {
        return `${field.displayName} must be at least ${validation.minLength} characters`;
      }

      // Max length validation
      if (validation.maxLength && String(value).length > validation.maxLength) {
        return `${field.displayName} cannot exceed ${validation.maxLength} characters`;
      }

      // Pattern validation
      if (validation.pattern && value) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(String(value))) {
          return validation.errorMessage || `${field.displayName} format is invalid`;
        }
      }
    }

    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field) => {
      const value = field.fieldPath
        ? getNestedValue(formData, field.fieldPath)
        : formData[field.identifier];
      
      const errorMessage = validateField(field, value);
      if (errorMessage) {
        newErrors[field.identifier] = errorMessage;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldBlur = (field: FieldDefinition) => {
    const value = field.fieldPath
      ? getNestedValue(formData, field.fieldPath)
      : formData[field.identifier];
    
    const errorMessage = validateField(field, value);
    if (errorMessage) {
      setErrors(prev => ({ ...prev, [field.identifier]: errorMessage }));
    } else {
      // Clear error if valid
      setErrors(prev => ({ ...prev, [field.identifier]: '' }));
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const sortedFields = [...fields].sort((a: any, b: any) => a.order - b.order);

  return (
    <Dialog
      open={open}
      onClose={onBackDropClose ? (event, reason) => reason !== 'backdropClick' && onClose() : onClose}
      maxWidth="sm"
      fullWidth>
      <DialogTitle>{title || 'Edit User'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {sortedFields.map((field) => (
            <FormFieldRenderer
              key={field.identifier}
              field={field}
              value={field.fieldPath ? getNestedValue(formData, field.fieldPath) : formData[field.identifier]}
              onChange={(value) => handleFieldChange(field, value)}
              onBlur={() => handleFieldBlur(field)}
              error={errors[field.identifier]}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          color="primary"
        >
          {submitButtonText || 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}