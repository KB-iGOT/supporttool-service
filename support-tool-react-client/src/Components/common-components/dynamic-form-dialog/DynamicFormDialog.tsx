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
}

export const DynamicFormDialog: React.FC<DynamicFormDialogProps> = ({
  open,
  onClose,
  fields,
  initialData,
  onSubmit,
  title,
  submitButtonText
}) => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const newFormData = JSON.parse(JSON.stringify(initialData));
      setFormData(newFormData);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = field.fieldPath
        ? getNestedValue(formData, field.fieldPath)
        : formData[field.identifier];
      
      if (!field.optional && (!value || value === '')) {
        newErrors[field.identifier] = `${field.displayName} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const sortedFields = [...fields].sort((a: any, b: any) => a.order - b.order);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title ? title :'Dynamic Form'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {sortedFields.map((field) => (
            <FormFieldRenderer
              key={field.identifier}
              field={field}
              value={field.fieldPath ? getNestedValue(formData, field.fieldPath) : formData[field.identifier]}
              onChange={(value) => handleFieldChange(field, value)}
              error={errors[field.identifier]}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">{submitButtonText ? submitButtonText : 'Submit'}</Button>
      </DialogActions>
    </Dialog>
  );
}