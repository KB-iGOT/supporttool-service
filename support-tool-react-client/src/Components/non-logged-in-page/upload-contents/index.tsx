import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  IconButton,
  Snackbar,
  createTheme,
  ThemeProvider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import axios from 'axios';
import { format } from 'date-fns';
import { contentsService } from '../../../services/contents.service';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';

import env from "../../../Config/env";
// Create a default theme
const defaultTheme = createTheme();

// Interface definitions remain the same
interface ContentRequest {
  code: string;
  contentType: string;
  createdBy: string;
  description: string;
  framework: string;
  mimeType: string;
  name: string;
  redirectUrl: string;
  organisation: string[];
  channel: string;
  sequenceId: number;
  isExternal: boolean;
  primaryCategory: string;
  license: string;
  ownershipType: string[];
  purpose: string;
  visibility: string;
  location: { place: string };
  registrationLink: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  registrationEndDate: string;
  appIcon: string;
  source: string;
  position: string;
}

interface ContentCreateResponse {
  identifier: string;
  versionKey: string;
  node_id: string;
}

interface ContentUploadResponse {
  identifier: string;
  artifactUrl: string;
  versionKey: string;
  content_url: string;
  node_id: string;
}

// Add this function to transform the artifactUrl
const transformArtifactUrl = (url: string): string => {
  console.log(env)
  if (!url) return '';
  // Replace the Google Cloud Storage URL with the content-store URL
  return url.replace(
    `https://storage.googleapis.com/${env?.isProduction? 'igotprod':'igotuat'}/content`, 
    `${env?.nonLoggedInBaseUrl}${env?.nonLoggedInBucketName}/content`
  );
};

// Add this helper function to check if PDF can be viewed in the browser
const canPreviewPDF = () => {
  // Check for Chrome by looking for the chrome property in a type-safe way
  const isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
  const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Chrome and Firefox have good PDF viewer support
  return isChrome || isFirefox || isSafari;
};

// Add this validation function before the UploadContents component
const validateRequiredFields = (contentData: ContentRequest): boolean => {
  // Check required fields in step 1
  return Boolean(
    contentData.name && 
    contentData.location?.place && 
    contentData.startDate && 
    contentData.endDate && 
    contentData.startTime && 
    contentData.endTime &&
    contentData.registrationEndDate
  );
};

// Main component - simpler structure
export const UploadContents = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Add the navigate hook
  const queryParams = new URLSearchParams(location.search);
  const primaryCategoryFromQuery = queryParams.get('primaryCategory');

  // Content types and mime types for dropdown menus
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

  // Check if the primaryCategoryFromQuery is in the list of valid categories
  const isPrimaryCategoryValid = primaryCategoryFromQuery
    ? primaryCategories.includes(primaryCategoryFromQuery)
    : false;

  // Get user from context
  const { user } = React.useContext(AppContext) as appContextType;

  // State declarations
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Create Content', 'Upload File', 'Preview & Update'];

  // Form states with default channel as "igot" and source as "Karmayogi Bharat"
  const [contentData, setContentData] = useState<ContentRequest>({
    code: primaryCategoryFromQuery || 'career',
    contentType: 'Resource',
    createdBy: user?.userId || '', // Initialize with user ID from context if available
    description: '',
    framework: 'igot',
    mimeType: 'application/pdf',
    name: '',
    redirectUrl: '',
    organisation: [''],
    channel: 'igot', // Default channel set to "igot"
    sequenceId: 0,
    isExternal: false,
    primaryCategory: primaryCategoryFromQuery || 'career',
    license: 'CC BY 4.0',
    ownershipType: ['createdFor'],
    purpose: '',
    visibility: 'Default',
    location: { place: '' },
    startDate: '',
    endDate: '',
    startTime: '09:30:00+05:30',
    endTime: '17:00:00+05:30',
    registrationEndDate: '',
    registrationLink: '',
    appIcon: 'https://karmayogibharat.gov.in/assets/images/logo.svg', // Default app icon
    source: 'Karmayogi Bharat', // Default source
    position: 'Open'
  });

  // Add validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Get user ID for createdBy field
  useEffect(() => {
   console.log(transformArtifactUrl('https://storage.googleapis.com/igotuat/content/do_114341418278051840182/artifact/do_114341418278051840182_1750661705875_civicconnect.pdf'))
    if (user && user.userId) {
      setContentData(prev => ({
        ...prev,
        createdBy: user.userId
      }));
    }
  }, [user]);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API response states
  const [createResponse, setCreateResponse] = useState<ContentCreateResponse | null>(null);
  const [uploadResponse, setUploadResponse] = useState<ContentUploadResponse | null>(null);

  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  // Content types and mime types for dropdown menus
  const mimeTypes = [
    { value: 'image/png', label: 'PNG Image' },
    { value: 'image/jpeg', label: 'JPEG Image' },
    { value: 'image/svg+xml', label: 'SVG Image' },
    { value: 'application/pdf', label: 'PDF Document' },
    { value: 'video/mp4', label: 'MP4 Video' },
    { value: 'application/vnd.ekstep.html-archive', label: 'HTML Archive' }
  ];

  // Add these reset functions

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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle time input changes
  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Format the time value to match the API format
    const formattedTime = `${value}:00+05:30`;
    setContentData(prev => ({
      ...prev,
      [name]: formattedTime
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle organisation input (comma separated)
  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const orgs = e.target.value.split(',').map(org => org.trim());
    setContentData(prev => ({
      ...prev,
      organisation: orgs
    }));
  };

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

  // Handle step navigation
  const handleNext = () => {
    if (activeStep === 0) {
      // Only call API if we don't already have a content ID from a previous creation
      if (createResponse?.identifier) {
        // Skip API call and just move to next step
        setActiveStep(1);
      } else if (validateForm()) {
        handleCreateContent();
      } else {
        setError('Please fill in all required fields correctly');
        setSnackbarOpen(true);
      }
    } else if (activeStep === 1) {
      // Only call upload API if we don't already have an upload response
      if (uploadResponse?.artifactUrl) {
        // Skip API call and just move to next step
        setActiveStep(2);
      } else if (selectedFile) {
        handleUploadContent();
      } else {
        setError('Please select a file to upload');
        setSnackbarOpen(true);
      }
    } else {
      handleUpdateContent();
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    // Don't reset any response data when going back
  };

  // Add validation before submit
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate name
    if (!contentData.name.trim()) {
      errors.name = 'Content name is required';
    }
    
    // Validate location
    if (!contentData.location.place.trim()) {
      errors.locationPlace = 'Location is required';
    }
    
    // Validate dates
    if (!contentData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!contentData.endDate) {
      errors.endDate = 'End date is required';
    } else if (contentData.endDate < contentData.startDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (!contentData.registrationEndDate) {
      errors.registrationEndDate = 'Registration end date is required';
    } else if (contentData.startDate && contentData.endDate) {
      // Registration end date must be between start date and end date
      if (contentData.registrationEndDate < contentData.startDate) {
        errors.registrationEndDate = 'Registration end date must be on or after start date';
      } else if (contentData.registrationEndDate > contentData.endDate) {
        errors.registrationEndDate = 'Registration end date must be on or before end date';
      }
    }
    
    // Validate times
    if (!extractTime(contentData.startTime)) {
      errors.startTime = 'Start time is required';
    }
    
    if (!extractTime(contentData.endTime)) {
      errors.endTime = 'End time is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // API calls remain mostly the same
  const handleCreateContent = async () => {
    setLoading(true);
    setError(null);

    try {
      let requestData = {
        request: {
          content: {
            name: contentData.name,
            description: contentData.description,
            location: contentData.location,
            createdBy: contentData.createdBy || user?.userId || '',
            registrationLink: contentData.registrationLink,
            startDate: contentData.startDate,
            endDate: contentData.endDate,
            startTime: contentData.startTime,
            endTime: contentData.endTime,
            code: contentData.code,
            registrationEndDate: contentData.registrationEndDate,
            appIcon: contentData.appIcon,
            primaryCategory: contentData.primaryCategory,
            channel: contentData.channel, // Using the default "igot" value
            mimeType: contentData.mimeType,
            source: contentData.source,
            position: contentData.position,
            contentType: 'Resource',
            framework: 'igot',
            license: 'CC BY 4.0',
            ownershipType: ['createdFor'],
            visibility: 'Default'
          }
        }
      };
      const response = await contentsService.privateContentCreate(requestData);

      if (response.responseCode === 'OK' && response.result) {
        setCreateResponse(response.result);
        setSuccess('Content created successfully! Now you can upload a file.');
        setSnackbarOpen(true);
        setActiveStep(1);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error creating content:', err);
      setError(`Failed to create content: ${err.response?.data?.params?.errmsg || err.message}`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadContent = async () => {
    if (!selectedFile || !createResponse?.identifier) {
      setError('Please select a file to upload and ensure content was created successfully');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('data', selectedFile);

      const contentId = createResponse?.identifier;
      const response = await contentsService.privateContentUpload(formData, contentId);

      if (response.status === 200 && response.result.result) {
        // Transform the artifactUrl before setting it in state
        const result = response.result.result;
        result.artifactUrl = transformArtifactUrl(result.artifactUrl);

        setUploadResponse(result);
        setPreviewUrl(result.artifactUrl)
        setSuccess('File uploaded successfully! You can now view content details.');
        setSnackbarOpen(true);
        setActiveStep(2);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(`Failed to upload file: ${err.response?.data?.params?.errmsg || err.message}`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContent = async () => {
    if (!uploadResponse || !createResponse) {
      setError('Missing required data from previous steps');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        request: {
          content: {
            identifier: createResponse?.identifier,
            artifactUrl: uploadResponse.artifactUrl,
            versionKey: uploadResponse.versionKey
            // Removed redirectUrl
          }
        }
      };

      const response = await contentsService.privateContentUpdate(updateData, createResponse?.identifier);
      
      if (response.status === 200) {
        setSuccess('Content updated successfully! Redirecting to content list...');
        setSnackbarOpen(true);

        // Add a delay before navigation to show success message
        setTimeout(() => {
          // Navigate to the appropriate page based on primaryCategory
          const targetPage = primaryCategoryFromQuery || 'career';
          navigate(`/non-logged-in-page/${targetPage}`);
        }, 2000);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error updating content:', err);
      setError(`Failed to update content: ${err.response?.data?.params?.errmsg || err.message}`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setContentData({
      code: primaryCategoryFromQuery || 'career',
      contentType: 'Resource',
      createdBy: user?.userId || '',
      description: '',
      framework: 'igot',
      mimeType: 'application/pdf',
      name: '',
      redirectUrl: '',
      organisation: [''],
      channel: 'igot', // Keep default channel as "igot"
      sequenceId: 0,
      isExternal: false,
      primaryCategory: primaryCategoryFromQuery || 'career',
      license: 'CC BY 4.0',
      ownershipType: ['createdFor'],
      purpose: '',
      visibility: 'Default',
      location: { place: '' },
      startDate: '',
      endDate: '',
      startTime: '09:30:00+05:30',
      endTime: '17:00:00+05:30',
      registrationEndDate: '',
      registrationLink: '',
      appIcon: 'https://karmayogibharat.gov.in/assets/images/logo.svg',
      source: 'Karmayogi Bharat',
      position: 'Open'
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setCreateResponse(null);
    setUploadResponse(null);
    setActiveStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper function to extract time for form fields
  const extractTime = (timeString: string): string => {
    const match = timeString.match(/(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return "09:30";
  };

  // Add a reset button to each step's form
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

  // Render Create Content Form
  const renderCreateContentForm = () => {
    return (
      <Grid container spacing={3}>
        {createResponse?.identifier && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Content already created with ID: {createResponse.identifier}. You can proceed to the next step or make changes and create new content.
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Fields marked with * are required. The Registration End Date must be between the Start Date and End Date.
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="name"
            label="Content Name *"
            fullWidth
            value={contentData.name}
            onChange={handleInputChange}
            required
            margin="normal"
            error={Boolean(formErrors.name)}
            helperText={formErrors.name || ''}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={contentData.description}
            onChange={handleInputChange}
            margin="normal"
          />
        </Grid>

        {/* Location field - nested object */}
        <Grid item xs={12} md={6}>
          <TextField
            name="locationPlace"
            label="Location *"
            fullWidth
            value={contentData.location?.place || ''}
            onChange={(e) => {
              const place = e.target.value;
              setContentData(prev => ({
                ...prev,
                location: { place }
              }));
              
              // Clear error
              if (formErrors.locationPlace) {
                setFormErrors(prev => ({
                  ...prev,
                  locationPlace: ''
                }));
              }
            }}
            required
            margin="normal"
            error={Boolean(formErrors.locationPlace)}
            helperText={formErrors.locationPlace || ''}
          />
        </Grid>

        {/* Date fields */}
        <Grid item xs={12} md={6}>
          <TextField
            name="startDate"
            label="Start Date *"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={contentData.startDate}
            onChange={handleInputChange}
            required
            margin="normal"
            error={Boolean(formErrors.startDate)}
            helperText={formErrors.startDate || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="endDate"
            label="End Date *"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={contentData.endDate}
            onChange={handleInputChange}
            required
            margin="normal"
            error={Boolean(formErrors.endDate)}
            helperText={formErrors.endDate || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="registrationEndDate"
            label="Registration End Date *"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={contentData.registrationEndDate}
            onChange={handleInputChange}
            required
            margin="normal"
            error={Boolean(formErrors.registrationEndDate)}
            helperText={formErrors.registrationEndDate || ''}
          />
        </Grid>

        {/* Time fields - using standard text fields with type="time" */}
        <Grid item xs={12} md={6}>
          <TextField
            name="startTime"
            label="Start Time *"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={extractTime(contentData.startTime)}
            onChange={handleTimeInput}
            required
            margin="normal"
            error={Boolean(formErrors.startTime)}
            helperText={formErrors.startTime || ''}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="endTime"
            label="End Time *"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={extractTime(contentData.endTime)}
            onChange={handleTimeInput}
            required
            margin="normal"
            error={Boolean(formErrors.endTime)}
            helperText={formErrors.endTime || ''}
          />
        </Grid>

        {/* CreatedBy is now hidden as we're using the logged-in user's ID */}
        <Grid item xs={12} md={6}>
          <TextField
            name="createdBy"
            label="Created By"
            fullWidth
            value={contentData.createdBy || (user?.userId || '')}
            disabled
            margin="normal"
            helperText={user?.name ? `Using ${user.name}'s account` : "Using your account ID"}
          />
        </Grid>

        {/* Channel field - now disabled with default value "igot" */}
        <Grid item xs={12} md={6}>
          <TextField
            name="channel"
            label="Channel"
            fullWidth
            value={contentData.channel}
            disabled
            margin="normal"
            helperText="Default channel for all content"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="source"
            label="Source"
            fullWidth
            value={contentData.source}
            disabled
            margin="normal"
            helperText="Default source for all content"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Primary Category *</InputLabel>
            <Select
              name="primaryCategory"
              value={contentData.primaryCategory}
              onChange={handleSelectChange}
              required
              disabled={isPrimaryCategoryValid} // Disable if the primary category from query is valid
            >
              <MenuItem value="career">Career</MenuItem>
              {primaryCategories.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
            {isPrimaryCategoryValid && (
              <FormHelperText>Category set from URL parameter</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>MIME Type *</InputLabel>
            <Select
              name="mimeType"
              value={contentData.mimeType}
              onChange={handleSelectChange}
              required
            >
              <MenuItem value="application/pdf">PDF Document</MenuItem>
              {mimeTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Position</InputLabel>
            <Select
              name="position"
              value={contentData.position}
              onChange={handleSelectChange}
            >
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    );
  };

  // Render methods remain mostly the same
  const renderFileUploadForm = () => {
    if (!createResponse?.identifier) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Content creation is required before uploading. Please go back and create content first.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Content created successfully! Content ID: {createResponse?.identifier}
          </Alert>
        </Grid>

        {uploadResponse?.artifactUrl && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 2 }}>
              File already uploaded. You can proceed to the next step or select a new file to replace it.
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} sx={{ textAlign: 'center' }}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
              disabled={loading}
            >
              Select File
            </Button>
          </label>

          {selectedFile && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Selected File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Typography>
              <IconButton color="error" onClick={handleRemoveFile}>
                <RemoveCircleIcon />
              </IconButton>
            </Box>
          )}
        </Grid>

        {previewUrl && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Preview</Typography>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center', maxHeight: '300px', overflow: 'hidden' }}>
              {contentData.mimeType.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '250px' }}
                />
              ) : contentData.mimeType === 'application/pdf' ? (
                <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    PDF Document Selected
                  </Typography>
                  <Box 
                    component="div"
                    sx={{ 
                      p: 3, 
                      border: '1px solid #ddd', 
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      my: 2,
                      bgcolor: 'white'
                    }}
                  >
                    <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                      PDF
                    </Typography>
                    <Typography>
                      {selectedFile?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ({(selectedFile?.size || 0) / 1024 > 1024 
                        ? ((selectedFile?.size || 0) / 1024 / 1024).toFixed(2) + ' MB'
                        : ((selectedFile?.size || 0) / 1024).toFixed(2) + ' KB'})
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    PDF preview will be available after upload
                  </Typography>
                </Box>
              ) : contentData.mimeType.startsWith('video/') ? (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <video 
                    controls 
                    width="100%" 
                    height="auto" 
                    style={{ maxHeight: '250px' }}
                  >
                    <source src={previewUrl} type={contentData.mimeType} />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              ) : (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography>
                    File selected: {selectedFile?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Preview not available for this file type.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderPreviewAndUpdate = () => {
    if (!uploadResponse?.artifactUrl) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          File upload is required before updating. Please go back and upload a file first.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="success" sx={{ mb: 2 }}>
            File uploaded successfully!
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Content Details</Typography>
              <Typography><strong>Name:</strong> {contentData.name}</Typography>
              <Typography><strong>Description:</strong> {contentData.description || 'N/A'}</Typography>
              <Typography><strong>Content Type:</strong> {contentData.contentType}</Typography>
              <Typography><strong>Primary Category:</strong> {contentData.primaryCategory}</Typography>
              <Typography><strong>MIME Type:</strong> {contentData.mimeType}</Typography>
              <Typography><strong>Created By:</strong> {contentData.createdBy || user?.userId || ''}</Typography>
              <Typography><strong>Source:</strong> {contentData.source}</Typography>
              <Typography><strong>Channel:</strong> {contentData.channel}</Typography>
              <Typography><strong>Content ID:</strong> {createResponse?.identifier}</Typography>
              <Typography><strong>Start Date:</strong> {contentData.startDate}</Typography>
              <Typography><strong>End Date:</strong> {contentData.endDate}</Typography>
              <Typography><strong>Start Time:</strong> {extractTime(contentData.startTime)}</Typography>
              <Typography><strong>End Time:</strong> {extractTime(contentData.endTime)}</Typography>
              <Typography><strong>Registration End Date:</strong> {contentData.registrationEndDate}</Typography>
              <Typography><strong>Location:</strong> {contentData.location.place}</Typography>
              <Typography><strong>Artifact URL:</strong> {uploadResponse.artifactUrl}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>File Preview</Typography>

              {contentData.mimeType.startsWith('image/') && previewUrl ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                  />
                </Box>
              ) : contentData.mimeType === 'application/pdf' && previewUrl ? (
                <Box sx={{ textAlign: 'center', height: '300px', overflow: 'hidden' }}>
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    width="100%"
                    height="300px"
                    style={{ border: 'none' }}
                  >
                    <Typography color="text.secondary">
                      PDF preview not available. You can view it using the artifact URL.
                    </Typography>
                  </iframe>
                </Box>
              ) : contentData.mimeType.startsWith('video/') && previewUrl ? (
                <Box sx={{ textAlign: 'center' }}>
                  <video 
                    controls 
                    width="100%" 
                    height="auto" 
                    style={{ maxHeight: '300px' }}
                  >
                    <source src={previewUrl} type={contentData.mimeType} />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              ) : (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
                  <Typography>
                    File uploaded successfully
                  </Typography>
                  {selectedFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </Typography>
                  )}
                </Box>
              )}

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                <strong>Artifact URL:</strong> {uploadResponse.artifactUrl}
              </Typography>

              <Typography variant="body2" color="info" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                </Box>
                Content is now available at this URL
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const getStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderCreateContentForm();
      case 1:
        return renderFileUploadForm();
      case 2:
        return renderPreviewAndUpdate();
      default:
        return 'Unknown step';
    }
  };

  // Wrap the return in ThemeProvider
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box>
        {/* Display the primary category in the header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Upload Content</Typography>
            {primaryCategoryFromQuery && (
              <Typography variant="subtitle1" color="text.secondary">
                Category: {primaryCategoryFromQuery.charAt(0).toUpperCase() + primaryCategoryFromQuery.slice(1)}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            onClick={resetForm}
            disabled={loading}
            startIcon={<ArrowBackIcon />}
          >
            Start Over
          </Button>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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
              loading || 
              (activeStep === 0 && !validateRequiredFields(contentData)) ||
              (activeStep === 1 && !selectedFile)
            }
            endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading
              ? 'Processing...'
              : activeStep === steps.length - 1
              ? 'Finish'
              : activeStep === 0
              ? 'Create Content'
              : 'Upload File'}
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