import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  LinearProgress, 
  Typography, 
  Alert, 
  Divider,
  Snackbar
} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formsService } from "../../services/forms.service";
import { JsonEditor } from "../common-components/json-editor/json-editor";
import { FormFilter, FormFilterData } from "./form-filter";
import { CreateForm } from "./create-form";
import { appContextType } from "../../types";
import { AppContext } from "../../Context/AppContext";

export const Forms = () => {
  const [formsFilter, setFormsFilter] = useState<FormFilterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data for the JSON editor
  const [formData, setFormData] = useState<any>(null);
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
  

  // Get permissions from context
  const { checkPermissions } = React.useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

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
        console.log("Forms data loaded:", data.length, "records");
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
      
      const response = await formsService.getFormReadData({
        type: filterValues.type,
        subtype: filterValues.subtype,
        action: filterValues.action,
        root_org: filterValues.root_org,
        component: filterValues.component,
        framework: filterValues.framework
      });
      
      if (response?.status === 200) {
        console.log("Form read data loaded:", response.result);
        
        // Set the form data for the JSON editor
        let data = response.result.formData && response.result.formData.data || {};
        if(typeof data === "string") {
          try { 
            const parsedData = JSON.parse(data);
            setFormData(parsedData);
            // Validate JSON
            validateJson(parsedData);
            // Increment the key to force re-render of the JsonEditor
            setJsonEditorKey(prev => prev + 1);
            // Set form as loaded
            setFormLoaded(true);
          } catch (e) {
            console.error("Error parsing form data:", e);
            setError("Failed to parse form data. Please check the format.");
          }
        } else {
          setFormData(data);
          // Validate JSON
          validateJson(data);
          // Increment the key to force re-render of the JsonEditor
          setJsonEditorKey(prev => prev + 1);
          // Set form as loaded
          setFormLoaded(true);
        }
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
    setFormLoaded(false);
    
    // Clear active filter to prevent saving with incorrect filters
    // We don't actually clear the UI filter values because they're managed by the FormFilter component
    setActiveFilter(null);
    
    // Reset validation state
    setJsonValid(true);
    setJsonValidationMessage("");
  };
  
  // Save existing form data
  const handleSaveExistingForm = async () => {
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
    
    setLoading(true);
    try {
      const response = await formsService.updateFormData({
        type: activeFilter.type,
        subtype: activeFilter.subtype,
        action: activeFilter.action,
        root_org: activeFilter.root_org,
        component: activeFilter.component,
        framework: activeFilter.framework,
        data: formData
      });
      
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
  };
  
  // Save new form data (from create form component)
  const handleSaveNewForm = async (formMetadata: FormFilterData, jsonData: any) => {
    // Validate JSON before saving
    if (!validateJson(jsonData)) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await formsService.createFormData({
        type: formMetadata.type,
        subtype: formMetadata.subtype,
        action: formMetadata.action,
        root_org: formMetadata.root_org,
        component: formMetadata.component,
        framework: formMetadata.framework,
        data: jsonData
      });
      
      if (response?.status === 200) {
        setJsonValidationMessage("Form created successfully!");
        setJsonValid(true);
        setShowValidationMessage(true);
        // Exit create mode and refresh form list
        setCreateMode(false);
        fetchFormData();
      } else {
        setError("Failed to create form: " + (response?.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error creating form:", err);
      setError("Failed to create form: " + (err.message || "Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  };
  
  // Enter create form mode
  const handleCreateForm = () => {
    setCreateMode(true);
    setFormLoaded(false);
    setActiveFilter(null);
    setFormData(null);
    setJsonValid(true);
    setJsonValidationMessage("");
  };
  
  // Exit create form mode
  const handleExitCreateMode = () => {
    setCreateMode(false);
  };

  const handleSaveForm = async (formMetadata: FormFilterData, jsonData: any) => {
    // Validate JSON before saving
    if (!validateJson(jsonData)) {
      return;
    }
    
    setLoading(true);
    try {
      
      const response = await formsService.createFormData({
        type: formMetadata.type,
        subtype: formMetadata.subtype,
        action: formMetadata.action,
        root_org: formMetadata.root_org,
        component: formMetadata.component,
        framework: formMetadata.framework,
        data: jsonData
      });
      
      if (response?.status === 200) {
        setJsonValidationMessage("Form created successfully!");
        setJsonValid(true);
        setShowValidationMessage(true);
        // Exit create mode and refresh form list
        setCreateMode(false);
        fetchFormData();
      } else {
        setError("Failed to create form: " + (response?.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error creating form:", err);
      let message = err?.response?.data?.message || err?.message || "Unknown error occurred";
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
  
  if (loading && !formLoaded) {
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
              <Box display="flex" alignItems="center">
                {/* JSON validation indicator */}
                {formData !== null && (
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mr: 2,
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
                 {permissions.canWrite && (<Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSaveExistingForm}
                  disabled={loading || !jsonValid}
                  startIcon={<SaveIcon />}
                >
                  Save Configuration
                </Button>)}
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
    </Box>
  );
};