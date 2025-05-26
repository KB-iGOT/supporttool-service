import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  Collapse,
  IconButton
} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { JsonEditor } from "../common-components/json-editor/json-editor";
import { FormFilterData } from "./form-filter";

interface CreateFormProps {
  loading: boolean;
  onSave: (formData: FormFilterData, jsonData: any) => Promise<void>;
  onCancel: () => void;
}

export const CreateForm: React.FC<CreateFormProps> = ({
  loading,
  onSave,
  onCancel
}) => {
  // New form metadata
  const [newFormData, setNewFormData] = useState<FormFilterData>({
    root_org: "",
    framework: "",
    type: "",
    subtype: "",
    action: "",
    component: ""
  });
  
  // Form data for JSON editor
  const [jsonData, setJsonData] = useState<any>({});
  
  // JSON validation state
  const [jsonIsValid, setJsonIsValid] = useState<boolean>(true);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [showValidationAlert, setShowValidationAlert] = useState<boolean>(false);
  const [validationAlertType, setValidationAlertType] = useState<'success' | 'error'>('success');
  
  // Track if fields have been touched/edited by the user
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({
    type: false,
    subtype: false,
    action: false,
    root_org: false,
    component: false,
    framework: false
  });
  
  // Track if the form has been submitted at least once
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  
  // Track if manual validation has been triggered
  const [manualValidation, setManualValidation] = useState<boolean>(false);
  
  // Reference to track component mount state
  const isMounted = useRef(false);
  
  // Set component as mounted after initial render
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Trigger validation effect when JSON changes, but only after initial render
  useEffect(() => {
    // Skip validation on first render
    if (!isMounted.current) return;
    
    // Validate JSON when it changes (with debounce)
    const timer = setTimeout(() => {
      // Only show validation messages if manual validation was triggered or submission attempted
      const showMessage = manualValidation || attemptedSubmit;
      validateJson(showMessage);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [jsonData, manualValidation, attemptedSubmit]);
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setNewFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };
  
  // Handle field blur to mark as touched
  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };
  
  // Handle JSON editor changes
  const handleJsonChange = (newData: any) => {
    setJsonData(newData);
  };
  
  // Validate JSON data
  const validateJson = (showMessage: boolean = false) => {
    try {
      // For objects already parsed by the JsonEditor, we need to ensure it's a valid object
      if (jsonData === null || jsonData === undefined) {
        throw new Error("JSON data cannot be null or undefined");
      }
      
      // Check if the object has any properties or if it's an array with items
      if (Array.isArray(jsonData)) {
        // It's valid if it's an array (even empty)
        setJsonIsValid(true);
        setJsonValidationError(null);
        
        // Show success message only if requested
        if (showMessage) {
          setValidationAlertType('success');
          setShowValidationAlert(true);
          
          // Auto-hide success message after 3 seconds
          const timer = setTimeout(() => {
            if (isMounted.current) {
              setShowValidationAlert(false);
            }
          }, 3000);
          
          return () => clearTimeout(timer);
        }
      } else if (typeof jsonData === 'object') {
        // It's valid if it's an object (even empty)
        setJsonIsValid(true);
        setJsonValidationError(null);
        
        // Show success message only if requested
        if (showMessage) {
          setValidationAlertType('success');
          setShowValidationAlert(true);
          
          // Auto-hide success message after 3 seconds
          const timer = setTimeout(() => {
            if (isMounted.current) {
              setShowValidationAlert(false);
            }
          }, 3000);
          
          return () => clearTimeout(timer);
        }
      } else {
        // If it's not an object or array, it's invalid
        throw new Error("JSON data must be an object or array");
      }
    } catch (error: any) {
      // Set validation error
      setJsonIsValid(false);
      setJsonValidationError(error.message || "Invalid JSON data");
      
      // Show error message only if requested
      if (showMessage) {
        setValidationAlertType('error');
        setShowValidationAlert(true);
      }
    }
  };
  
  // Manually trigger JSON validation
  const handleValidateClick = () => {
    setManualValidation(true);
    validateJson(true);
  };
  
  // Validate if all required fields are filled
  const isFormValid = () => {
    return (
      jsonIsValid &&
      newFormData.type.trim() !== "" &&
      newFormData.subtype.trim() !== "" &&
      newFormData.action.trim() !== "" &&
      newFormData.root_org.trim() !== "" &&
      newFormData.component.trim() !== "" &&
      newFormData.framework.trim() !== ""
    );
  };
  
  // Check if a field should show error state
  const shouldShowError = (fieldName: keyof FormFilterData) => {
    return (touchedFields[fieldName] || attemptedSubmit) && newFormData[fieldName].trim() === "";
  };
  
  // Handle save button click
  const handleSave = async () => {
    // Mark as attempted submit to show all validation errors
    setAttemptedSubmit(true);
    
    if (isFormValid()) {
      await onSave(newFormData, jsonData);
    } else if (!jsonIsValid) {
      setValidationAlertType('error');
      setShowValidationAlert(true);
    }
  };
  
  return (
    <>
      {/* Form header with back button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Form Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new form configuration
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onCancel}
          disabled={loading}
        >
          Back to Form Filter
        </Button>
      </Box>
      
      {/* JSON validation alert - only shown when explicitly triggered */}
      <Collapse in={showValidationAlert} sx={{ mb: 2 }}>
        <Alert
          severity={validationAlertType}
          icon={validationAlertType === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowValidationAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {validationAlertType === 'success' 
            ? "JSON is valid and ready to save."
            : `JSON validation error: ${jsonValidationError}`
          }
        </Alert>
      </Collapse>
      
      {/* Form metadata fields */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Form Parameters</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                name="type"
                label="Type *"
                fullWidth
                value={newFormData.type}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('type')}
                required
                error={shouldShowError('type')}
                helperText={shouldShowError('type') ? "Type is required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="subtype"
                label="Subtype *"
                fullWidth
                value={newFormData.subtype}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('subtype')}
                required
                error={shouldShowError('subtype')}
                helperText={shouldShowError('subtype') ? "Subtype is required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="action"
                label="Action *"
                fullWidth
                value={newFormData.action}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('action')}
                required
                error={shouldShowError('action')}
                helperText={shouldShowError('action') ? "Action is required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="root_org"
                label="Root Organization *"
                fullWidth
                value={newFormData.root_org}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('root_org')}
                required
                error={shouldShowError('root_org')}
                helperText={shouldShowError('root_org') ? "Root Organization is required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="component"
                label="Component *"
                fullWidth
                value={newFormData.component}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('component')}
                required
                error={shouldShowError('component')}
                helperText={shouldShowError('component') ? "Component is required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="framework"
                label="Framework *"
                fullWidth
                value={newFormData.framework}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('framework')}
                required
                error={shouldShowError('framework')}
                helperText={shouldShowError('framework') ? "Framework is required" : ""}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              * All fields are required
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* JSON Editor */}
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Form Configuration Editor (New Form)</Typography>
            <Box display="flex" gap={2}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleValidateClick}
                disabled={loading}
              >
                Validate JSON
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave}
                disabled={loading || (attemptedSubmit && !isFormValid())}
                startIcon={<SaveIcon />}
              >
                Save Configuration
              </Button>
            </Box>
          </Box>
          
          <JsonEditor 
            input={jsonData} 
            onChange={handleJsonChange}
          />
        </CardContent>
      </Card>
    </>
  );
};