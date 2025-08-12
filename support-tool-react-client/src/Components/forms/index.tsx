import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  LinearProgress, 
  Typography, 
  Alert, 
  Divider,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formsService } from "../../services/forms.service";
import { JsonEditor } from "../common-components/json-editor/json-editor";
import { FormFilter, FormFilterData } from "./form-filter";
import { CreateForm } from "./create-form";
import { appContextType } from "../../types";
import { AppContext } from "../../Context/AppContext";
import { useActionInterceptor } from '../../hooks/useActionInterceptor';

export const Forms = () => {
  const [formsFilter, setFormsFilter] = useState<FormFilterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data for the JSON editor
  const [formData, setFormData] = useState<any>(null);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [jsonEditorKey, setJsonEditorKey] = useState<number>(0);
  const [formLoaded, setFormLoaded] = useState<boolean>(false);
  
  // Track the currently active filter
  const [activeFilter, setActiveFilter] = useState<FormFilterData | null>(null);
  
  // Create form mode state
  const [createMode, setCreateMode] = useState<boolean>(false);
  
  // JSON validation state
  const [jsonValid, setJsonValid] = useState<boolean>(true);
  const [jsonValidationMessage, setJsonValidationMessage] = useState<string>("");
  const [showValidationMessage, setShowValidationMessage] = useState<boolean>(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  // Get permissions from context
  const { checkPermissions } = useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

  // Create a ref to hold the latest form data
  const latestFormDataRef = useRef<{
    formData: any;
    activeFilter: FormFilterData | null;
  }>({
    formData: null,
    activeFilter: null
  });

  // Load form data on component mount
  useEffect(() => {
    fetchFormData();
  }, []);
  
  const fetchFormData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await formsService.getFormsFacets();
      
      if (response?.status === 200) {
        const data = response?.result?.rows || response?.result?.data || [];
        setFormsFilter(data);
      } else {
        console.warn("Using sample data due to API error");
        setFormsFilter([]);
      }
    } catch (err) {
      console.error("Error fetching forms data:", err);
      setError("Failed to load form data. Please try again.");
      setFormsFilter([]);
    } finally {
      setLoading(false);
    }
  };

  // Validate JSON data
  const validateJson = (jsonData: any): boolean => {
    // Check if JSON data exists
    if (!jsonData) {
      setJsonValidationMessage("JSON data is required and cannot be empty.");
      setJsonValid(false);
      setShowValidationMessage(true);
      return false;
    }
    
    // Check if JSON data is an object
    if (typeof jsonData !== 'object') {
      setJsonValidationMessage("JSON data must be a valid object.");
      setJsonValid(false);
      setShowValidationMessage(true);
      return false;
    }
    
    // Check if JSON data is empty object
    if (Object.keys(jsonData).length === 0) {
      setJsonValidationMessage("JSON data cannot be an empty object.");
      setJsonValid(false);
      setShowValidationMessage(true);
      return false;
    }
    
    // If we reach here, JSON is valid
    setJsonValid(true);
    setJsonValidationMessage("JSON is valid!");
    return true;
  };

  // Handle form data changes in the JSON editor
  const handleFormDataChange = (newData: any) => {
    setFormData(newData);
    // Validate JSON on every change but don't show message yet
    validateJson(newData);
  };

  // Fetch form data based on selected filters
  const fetchFormReadData = async (filterValues: FormFilterData) => { 
    setLoading(true);
    setError(null);
    setFormLoaded(false);
    
    try {
      // Store the selected filter values for persistence
      setActiveFilter(filterValues);
      
      const response = await formsService.getFormReadData(filterValues);
      
      if (response?.status === 200) {
        
        // Set the form data for the JSON editor
        let data = response.result.formData?.data || {};
        
        // Parse string data if needed
        if (typeof data === "string") {
          try { 
            data = JSON.parse(data);
          } catch (e) {
            console.error("Error parsing form data:", e);
            setError("Failed to parse form data. Please check the format.");
            return;
          }
        }
        
        setInitialFormData(data);
        setFormData(data);
        validateJson(data);
        setJsonEditorKey(prev => prev + 1);
        setFormLoaded(true);
      } else {
        console.warn("Error loading form data:", response?.message || "Unknown error");
        setError("Failed to load form data. " + (response?.message || "Please try again."));
      }
    } catch (err: any) {
      console.error("Error fetching form read data:", err);
      setError("Failed to load form data: " + (err.message || "Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes - hide the editor when filters change
  const handleFilterChange = () => {
    // Hide form data when filter changes by setting it to null (not empty object)
    // This ensures the editor and "formData" state are completely reset
    setFormData(null);
    setInitialFormData(null);
    setFormLoaded(false);
    
    // Clear active filter to prevent saving with incorrect filters
    // We don't actually clear the UI filter values because they're managed by the FormFilter component
    setActiveFilter(null);
    
    // Reset validation state
    setJsonValid(true);
    setJsonValidationMessage("");
  };
  
  // Modified handleSaveExistingForm to use the ref and interceptor pattern
  const handleSaveExistingForm = useCallback(() => {
    if (!formData || !activeFilter) {
      setJsonValidationMessage("No form data to save");
      setJsonValid(false);
      setShowValidationMessage(true);
      return;
    }
    
    // Validate JSON before saving
    if (!validateJson(formData)) {
      return;
    }

    // Update the ref with latest data
    latestFormDataRef.current = {
      formData,
      activeFilter
    };
    
    // Trigger the action interceptor
    handleSaveFormSubmit();
  }, [formData, activeFilter]);

  // Action interceptor for form saving
  const { handleAction: handleSaveFormSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => saveFormWithJira(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  // Function that performs the actual save with jira ticket info
  const saveFormWithJira = useCallback(async (interceptPayload: any, formInfo: any) => {
    setLoading(true);
    
    try {
      // Prepare the request payload with changed fields tracking
     
      
      const request = {
        payload: {
          ...formInfo.activeFilter,
          data: formInfo.formData
        },
        changedFields: '',
        jiraLink: interceptPayload?.jiraLink || "",
        module: "forms",
      };
      
      const response = await formsService.updateFormData(request);
      
      if (response?.status === 200) {
        setJsonValidationMessage("Form data saved successfully!");
        setJsonValid(true);
        setShowValidationMessage(true);
      } else {
        setError("Failed to save form data: " + (response?.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error saving form data:", err);
      setError("Failed to save form data: " + (err.message || "Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  }, [initialFormData, setLoading, setError, setJsonValidationMessage, setJsonValid, setShowValidationMessage]);

  // Enter create form mode
  const handleCreateForm = () => {
    setCreateMode(true);
    setFormLoaded(false);
    setActiveFilter(null);
    setFormData(null);
    setInitialFormData(null);
    setJsonValid(true);
    setJsonValidationMessage("");
  };

  const handleSaveForm = async (formMetadata: FormFilterData, jsonData: any) => {
    if (!validateJson(jsonData)) return;
    
    setLoading(true);
    try {
      const response = await formsService.createFormData({
        ...formMetadata,
        data: jsonData
      });
      
      if (response?.status === 200) {
        setJsonValidationMessage("Form created successfully!");
        setJsonValid(true);
        setShowValidationMessage(true);
        setCreateMode(false);
        fetchFormData();
      } else {
        setError("Failed to create form: " + (response?.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error creating form:", err);
      const message = err?.response?.data?.message || err?.message || "Unknown error occurred";
      setError("Failed to create form: " + message);
      setCreateMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCreateMode(false);
  };
  
  // Handle close of validation message
  const handleCloseValidationMessage = () => {
    setShowValidationMessage(false);
  };
  
  // Delete form confirmation dialog
  const handleDeleteForm = () => {
    if (!activeFilter) {
      setJsonValidationMessage("No form selected for deletion");
      setJsonValid(false);
      setShowValidationMessage(true);
      return;
    }
    setDeleteDialogOpen(true);
  };

  // Confirm delete form
  const confirmDeleteForm = useCallback(() => {
    if (!activeFilter) return;
    
    // Update the ref with latest data for action interceptor
    latestFormDataRef.current = {
      formData: null,
      activeFilter
    };
    
    setDeleteDialogOpen(false);
    handleDeleteFormSubmit();
  }, [activeFilter]);

  // Action interceptor for form deletion
  const { handleAction: handleDeleteFormSubmit } = useActionInterceptor({
    actionType: 'Delete',
    onComplete: (interceptPayload) => deleteFormWithJira(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  // Function that performs the actual delete with jira ticket info
  const deleteFormWithJira = useCallback(async (interceptPayload: any, formInfo: any) => {
    setLoading(true);
    
    try {
      const request = {
        payload: formInfo.activeFilter,
        jiraLink: interceptPayload?.jiraLink || "",
        module: "forms",
      };
      
      const response = await formsService.deleteFormData(request);
      
      if (response?.status === 200) {
        setJsonValidationMessage("Form deleted successfully!");
        setJsonValid(true);
        setShowValidationMessage(true);
        
        // Reset form state after successful deletion
        setFormData(null);
        setInitialFormData(null);
        setFormLoaded(false);
        setActiveFilter(null);
        
        // Refresh the forms list
        fetchFormData();
      } else {
        setError("Failed to delete form: " + (response?.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error deleting form:", err);
      setError("Failed to delete form: " + (err.message || "Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setJsonValidationMessage, setJsonValid, setShowValidationMessage, fetchFormData]);

  // Cancel delete dialog
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  if (loading && !formLoaded && !createMode) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography align="center" variant="body2" sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Box>
    );
  }
  

  
  // If in create mode, show the create form component
  if (createMode) {
    return (
      <CreateForm
        loading={loading}
        onSave={handleSaveForm}
        onCancel={handleCancel}
        formsData={formsFilter}
      />
    );
  }
  
  // Otherwise show the regular form filter and editor
  return (
    <Box>
      {error && (<Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>)}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Form Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Select form parameters to view or edit configuration
          </Typography>
        </Box>
        
        {permissions.canWrite && (<Button 
          variant="contained" 
          color="primary"
          onClick={handleCreateForm}
          startIcon={<AddIcon />}
          disabled={loading}
        >
          Create New Form
        </Button>)}
      </Box>
      
      {loading && (
        <Box sx={{ width: '100%', mt: 4, mb: 4 }}>
          <LinearProgress />
          <Typography align="center" variant="body2" sx={{ mt: 2 }}>
            {formLoaded ? "Saving form data..." : "Loading form data..."}
          </Typography>
        </Box>
      )}
      
      {/* Form Filter Component */}
      <FormFilter 
        loading={loading} 
        onSearch={fetchFormReadData} 
        formsData={formsFilter}
        selectedFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />
      
      {/* JSON Editor Section - Only show when form data is loaded */}
      {formData !== null && (
        <Card elevation={2} sx={{ mt: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">Form Configuration Editor</Typography>
              <Box display="flex" alignItems="center" gap={2}>
                {/* JSON validation indicator */}
                {formData !== null && (
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: jsonValid ? 'success.main' : 'warning.main'
                    }}
                  >
                    {jsonValid ? 
                      <CheckCircleIcon color="success" sx={{ mr: 0.5 }} /> : 
                      <WarningIcon color="warning" sx={{ mr: 0.5 }} />
                    }
                    <Typography variant="body2">
                      {jsonValid ? "Valid JSON" : "Invalid JSON"}
                    </Typography>
                  </Box>
                )}
                {permissions.canDelete &&(
                  <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleDeleteForm}
                      disabled={loading}
                      startIcon={<DeleteIcon />}
                    >
                      Delete Form
                    </Button>
                )}
                {permissions.canWrite && (
                  <>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSaveExistingForm}
                      disabled={loading || !jsonValid}
                      startIcon={<SaveIcon />}
                    >
                      Save Configuration
                    </Button>
                  </>
                )}
              </Box>
            </Box>
            
            {/* Use key to force re-render when formData changes */}
            <JsonEditor 
              key={jsonEditorKey}
              input={formData} 
              onChange={handleFormDataChange}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Instructions - Show when no form data is loaded */}
      {formData === null && (
        <Box mt={4}>
          <Alert severity="info">
            <Typography variant="subtitle2">How to find a form configuration:</Typography>
            <ol>
              <li>Select <strong>Type</strong> of the form configuration (use search to filter options)</li>
              <li>Select <strong>Subtype</strong> from available options</li>
              <li>Select <strong>Action</strong> type for the form</li>
              <li>Select <strong>Component</strong> for the form</li>
              <li>Select <strong>Framework</strong> for the form</li>
              <li>Select <strong>Root Organization</strong> the form belongs to</li>
              <li>Click <strong>Find Configuration</strong> to view or edit the form</li>
            </ol>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">To create a new form configuration:</Typography>
            <ol>
              <li>Click the <strong>Create New Form</strong> button</li>
              <li>Fill in all required form parameters</li>
              <li>Edit the JSON configuration in the editor</li>
              <li>Click <strong>Save Configuration</strong> to create the form</li>
            </ol>
          </Alert>
        </Box>
      )}
      
      {/* Validation message snackbar */}
      <Snackbar 
        open={showValidationMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseValidationMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseValidationMessage} 
          severity={jsonValid ? "success" : "warning"} 
          sx={{ width: '100%' }}
        >
          {jsonValidationMessage}
        </Alert>
      </Snackbar>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Form Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this form configuration? This action cannot be undone.
            {activeFilter && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2"><strong>Type:</strong> {activeFilter.type}</Typography>
                <Typography variant="body2"><strong>Subtype:</strong> {activeFilter.subtype}</Typography>
                <Typography variant="body2"><strong>Action:</strong> {activeFilter.action}</Typography>
                <Typography variant="body2"><strong>Component:</strong> {activeFilter.component}</Typography>
                <Typography variant="body2"><strong>Framework:</strong> {activeFilter.framework}</Typography>
                <Typography variant="body2"><strong>Root Org:</strong> {activeFilter.root_org}</Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteForm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};