import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  CircularProgress,
  createTheme,
  ThemeProvider,
  Snackbar,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';
import { validateRequiredFields } from './utils/contentHelpers';

// Import custom hooks
import { useContentForm } from './hooks/useContentForm';
import { useContentAPI } from './hooks/useContentAPI';
import { useStepUpdate } from './hooks/useStepUpdate';

// Import components
import ContentHeader from './components/ContentHeader';
import ContentStepper from './components/ContentStepper';
import ContentCreateForm from './components/ContentCreateForm';
import FileUploadForm from './components/FileUploadForm';
import ContentPreview from './components/ContentPreview';

// Create a default theme
const defaultTheme = createTheme();

// Main component
export const UploadContents: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const primaryCategoryFromQuery = queryParams.get('primaryCategory');
  const { doId } = useParams<{ doId: string }>();
  
  // Check if primaryCategory is valid
  const primaryCategories = [
    'Landing Page Resource',
    'Learning Resource',
    'Course',
    'Learning Path',
    'Banner',
    'career',
    'tender',
    'notification'
  ];
  const isPrimaryCategoryValid = primaryCategoryFromQuery
    ? primaryCategories.includes(primaryCategoryFromQuery)
    : false;

  // Get user from context
  const { user } = useContext(AppContext) as appContextType;

  // State for stepper
  const [activeStep, setActiveStep] = useState(0);
  // Make steps react to doId changes


  // UI states
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  // Custom hooks
  const {
    contentData,
    setContentData,
    formErrors,
    setFormErrors,
    validateForm,
    handleInputChange,
    handleSelectChange,
    handleTimeInput,
    handleLocationChange,
    resetForm,
    isEditMode
  } = useContentForm({ primaryCategoryFromQuery, doId });

  const {
    loading,
    isLoadingContent,
    createResponse,
    uploadResponse,
    fetchContentDetails,
    createContent,
    uploadFile,
    updateContent,
    setCreateResponse,
    setUploadResponse,
    originalContent
  } = useContentAPI({
    onSuccess: (message) => {
      setSuccess(message);
      setSnackbarOpen(true);
    },
    onError: (message) => {
      setError(message);
      setSnackbarOpen(true);
    }
  });
  const steps = React.useMemo(() => [
    doId || createResponse?.identifier ? 'Update Content' : 'Create Content',
    'Upload File',
    'Preview & Update'
  ], [doId, createResponse?.identifier]);
  // Step update hook
  const {
    updateContentMetadata,
    updateContentFile,
    updateContentFinal,
    isRefetching
  } = useStepUpdate({
    updateContent,
    contentData,
    createResponse,
    uploadResponse,
    isEditMode,
    originalContent,
    onSuccess: (message) => {
      setSuccess(message);
      setSnackbarOpen(true);
    },
    onError: (message) => {
      setError(message);
      setSnackbarOpen(true);
    }
  });

  // Fetch content details if in edit mode
  useEffect(() => {
    const loadContent = async () => {
      if (!doId) return;
      
      const result = await fetchContentDetails(doId);
      
      if (result) {
        const { contentDetails, locationObj } = result;
        
        // Prefill the form with fetched data
        setContentData(prev => ({
          ...prev,
          name: contentDetails.name || prev.name,
          description: contentDetails.description || prev.description,
          location: locationObj,
          createdBy: contentDetails.createdBy || prev.createdBy,
          registrationLink: contentDetails.registrationLink || prev.registrationLink,
          startDate: contentDetails.startDate || prev.startDate,
          endDate: contentDetails.endDate || prev.endDate,
          startTime: contentDetails.startTime || prev.startTime,
          endTime: contentDetails.endTime || prev.endTime,
          code: contentDetails.code || prev.code,
          registrationEndDate: contentDetails.registrationEndDate || prev.registrationEndDate,
          primaryCategory: contentDetails.primaryCategory || prev.primaryCategory,
          mimeType: contentDetails.mimeType || prev.mimeType,
          source: contentDetails.source || prev.source,
          position: contentDetails.position || prev.position,
          appIcon: contentDetails.appIcon || prev.appIcon,
          channel: contentDetails.channel || prev.channel
        }));
        
        // Set preview URL if there's an artifactUrl
        if (contentDetails.artifactUrl) {
          setPreviewUrl(contentDetails.artifactUrl);
        }
      }
    };
    
    loadContent();
  }, [doId]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Set appropriate mime type based on file
      const fileType = file.type;
      setContentData(prev => ({
        ...prev,
        mimeType: fileType
      }));
      
      // Create preview URL - handle PDFs differently
      if (fileType === 'application/pdf') {
        // For PDFs, use object URL instead of base64 to avoid data issues
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        // For other file types, use FileReader base64 approach
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset current step
  const resetCurrentStep = () => {
    if (activeStep === 0) {
      // Reset just the content creation data
      setCreateResponse(null);
      setUploadResponse(null);
    } else if (activeStep === 1) {
      // Reset just the file upload data
      setUploadResponse(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle step navigation
  const handleNext = () => {
    if (activeStep === 0) {
      if (isEditMode) {
        // In edit mode, we update after each step
        if (validateForm()) {
          updateContentMetadata().then(success => {
            if (success) setActiveStep(1);
          });
        } else {
          setError('Please fill in all required fields correctly');
          setSnackbarOpen(true);
        }
      } else {
        // Creation mode logic
        if (createResponse?.identifier) {
          // Content was already created but user came back to step 1 and made changes
          // We need to update the existing content before proceeding
          if (validateForm()) {
            // Use the metadata update function with create mode flag
            updateContentMetadata(false).then(success => {
              if (success) setActiveStep(1);
            });
          } else {
            setError('Please fill in all required fields correctly');
            setSnackbarOpen(true);
          }
        } else if (validateForm()) {
          // Initial content creation
          handleCreateContent();
        } else {
          setError('Please fill in all required fields correctly');
          setSnackbarOpen(true);
        }
      }
    } else if (activeStep === 1) {
      if (isEditMode) {
        // In edit mode with file upload
        if (selectedFile) {
          handleUploadContent().then(() => {
            // After upload, call the update API specifically for file update
            updateContentFile().then(success => {
              if (success) setActiveStep(2);
            });
          });
        } else if (uploadResponse?.artifactUrl) {
          // No new file, just move to next step
          setActiveStep(2);
        } else {
          setError('Please select a file to upload');
          setSnackbarOpen(true);
        }
      } else {
        // Original upload logic for create mode
        if (uploadResponse?.artifactUrl) {
          // Skip API call and just move to next step
          setActiveStep(2);
        } else if (selectedFile) {
          handleUploadContent();
        } else {
          setError('Please select a file to upload');
          setSnackbarOpen(true);
        }
      }
    } else {
      // Final step - use appropriate function based on mode
      if (isEditMode) {
        updateContentFinal().then(success => {
          if (success) {
            // Navigate after a delay
            setTimeout(() => {
              const targetPage = primaryCategoryFromQuery || 'career';
              navigate(`/non-logged-in-page/${targetPage}`);
            }, 2000);
          }
        });
      } else {
        handleUpdateContent();
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle create content
  const handleCreateContent = async () => {
    const result = await createContent(contentData);
    if (result) {
      setActiveStep(1);
    }
  };

  // Handle upload content
  const handleUploadContent = async () => {
    if (!selectedFile || !createResponse?.identifier) return false;
    
    const result = await uploadFile(selectedFile, createResponse.identifier);
    if (result) {
      return true;
    }
    return false;
  };

  // Handle update content
  const handleUpdateContent = async () => {
    if (!createResponse?.identifier) return;
    
    const success = await updateContent(
      contentData, 
      createResponse.identifier,
      isEditMode
    );
    
    if (success) {
      // Add a delay before navigation to show success message
      setTimeout(() => {
        // Navigate to the appropriate page based on primaryCategory
        const targetPage = primaryCategoryFromQuery || 'career';
        navigate(`/non-logged-in-page/${targetPage}`);
      }, 2000);
    }
  };

  // Full reset
  const handleFullReset = () => {
    resetForm();
    setSelectedFile(null);
    setPreviewUrl(null);
    setCreateResponse(null);
    setUploadResponse(null);
    setActiveStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get step label based on mode and current step
  const getStepButtonLabel = () => {
    if (loading || isLoadingContent) {
      return 'Processing...';
    }
    
    if (isRefetching) {
      return 'Fetching latest version...';
    }
    
    if (activeStep === steps.length - 1) {
      return 'Finish';
    }
    
    if (activeStep === 0) {
      if (isEditMode) {
        return 'Update Metadata';
      }
      
      // Change here: Check if doId exists or if content has already been created
      if (doId || createResponse?.identifier) {
        return 'Update Content';
      }
      
      return 'Create Content';
    }
    
    if (activeStep === 1) {
      if (isEditMode && selectedFile) {
        return 'Upload & Update';
      }
      return uploadResponse?.artifactUrl ? 'Continue' : 'Upload File';
    }
    
    return 'Continue';
  };

  // Render step content
  const getStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ContentCreateForm
            contentData={contentData}
            formErrors={formErrors}
            isEditMode={isEditMode}
            isPrimaryCategoryValid={isPrimaryCategoryValid}
            createResponseId={createResponse?.identifier}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleTimeInput={handleTimeInput}
            handleLocationChange={handleLocationChange}
            user={user}
          />
        );
      case 1:
        return (
          <FileUploadForm
            createResponse={createResponse}
            uploadResponse={uploadResponse}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            mimeType={contentData.mimeType}
            handleFileSelect={handleFileSelect}
            handleRemoveFile={handleRemoveFile}
            isEditMode={isEditMode}
            fileInputRef={fileInputRef}
          />
        );
      case 2:
        return (
          <ContentPreview
            contentData={contentData}
            createResponse={createResponse}
            uploadResponse={uploadResponse}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            userId={user?.userId}
            isEditMode={isEditMode}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  // Render the reset button for current step
  const renderResetButton = () => {
    // Only show reset if we have data to reset
    const shouldShow = (activeStep === 0 && createResponse) || 
                        (activeStep === 1 && uploadResponse);
    
    if (!shouldShow) return null;
    
    return (
      <Button
        variant="outlined"
        color="warning"
        onClick={resetCurrentStep}
        disabled={loading}
        sx={{ ml: 2 }}
      >
        Reset Current Step
      </Button>
    );
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box>
        <ContentHeader
          isEditMode={isEditMode}
          doId={doId}
          primaryCategory={primaryCategoryFromQuery}
          isLoading={isLoadingContent}
          onReset={handleFullReset}
        />

        <ContentStepper activeStep={activeStep} steps={steps} />

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          {getStepContent()}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Box>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            {renderResetButton()}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={
              loading || isLoadingContent || isRefetching || 
              (activeStep === 0 && !validateRequiredFields(contentData)) ||
              (activeStep === 1 && !selectedFile && !uploadResponse?.artifactUrl)
            }
            endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
            startIcon={(loading || isLoadingContent || isRefetching) && <CircularProgress size={20} color="inherit" />}
          >
            {getStepButtonLabel()}
          </Button>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default UploadContents;