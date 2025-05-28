import React, { useState, useRef } from 'react';
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
  Snackbar
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import axios from 'axios';
import { contentsService } from '../../services/contents.service';

// Define types for content creation
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
  resourceCategory: string;
}

// Define types for API responses
interface ContentCreateResponse {
    identifier: string;
    versionKey: string;
    node_id: string;
}

interface ContentUploadResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
    err?: string;
    errmsg?: string;
  };
  responseCode: string;
  result: {
    identifier: string;
    artifactUrl: string;
    versionKey: string;
  };
}

export const UploadContents = () => {
  // Step tracking
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Create Content', 'Upload File', 'Preview & Update'];

  // Form states
  const [contentData, setContentData] = useState<ContentRequest>({
    code: '',
    contentType: 'Resource',
    createdBy: '',
    description: '',
    framework: 'igot',
    mimeType: 'image/png',
    name: '',
    redirectUrl: '',
    organisation: [''],
    channel: '',
    sequenceId: 0,
    isExternal: false,
    primaryCategory: 'Landing Page Resource',
    license: 'CC BY 4.0',
    ownershipType: ['createdFor'],
    purpose: '',
    visibility: 'Default',
    resourceCategory: 'Banner'
  });
  
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
  const contentTypes = ['Resource', 'Course', 'Collection', 'Asset'];
  const mimeTypes = [
    { value: 'image/png', label: 'PNG Image' },
    { value: 'image/jpeg', label: 'JPEG Image' },
    { value: 'image/svg+xml', label: 'SVG Image' },
    { value: 'application/pdf', label: 'PDF Document' },
    { value: 'video/mp4', label: 'MP4 Video' },
    { value: 'application/vnd.ekstep.html-archive', label: 'HTML Archive' }
  ];
  const primaryCategories = [
    'Landing Page Resource',
    'Learning Resource',
    'Course',
    'Learning Path',
    'Banner'
  ];

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select input changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
    }));
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
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Set appropriate mime type based on file
      const fileType = file.type;
      setContentData(prev => ({
        ...prev,
        mimeType: fileType
      }));
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
      handleCreateContent();
    } else if (activeStep === 1) {
      handleUploadContent();
    } else {
      handleUpdateContent();
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // API Calls
  const handleCreateContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let requestData = {
        request: {
          content: contentData
        }
      }
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
      
      
      if (response.status === 200 && response.data) {
        setUploadResponse(response.data);
        setSuccess('File uploaded successfully! You can now update content details.');
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
            artifactUrl: uploadResponse.result.artifactUrl,
            versionKey: uploadResponse.result.versionKey,
            redirectUrl: contentData.redirectUrl
          }
        }
      };
      
      const response = await axios.post('/api/private/content/v3/update', updateData);
      
      if (response.status === 200) {
        setSuccess('Content updated successfully!');
        setSnackbarOpen(true);
        
        // Reset form after successful completion
        setTimeout(() => {
          resetForm();
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
      code: '',
      contentType: 'Resource',
      createdBy: '',
      description: '',
      framework: 'igot',
      mimeType: 'image/png',
      name: '',
      redirectUrl: '',
      organisation: [''],
      channel: '',
      sequenceId: 0,
      isExternal: false,
      primaryCategory: 'Landing Page Resource',
      license: 'CC BY 4.0',
      ownershipType: ['createdFor'],
      purpose: '',
      visibility: 'Default',
      resourceCategory: 'Banner'
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setCreateResponse({
      "identifier": "do_114321610581745664111",
      "node_id": "do_114321610581745664111",
      "versionKey": "1748243479296"
  });
    setUploadResponse(null);
    setActiveStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render step content based on active step
  const getStepContent = () => {
    switch(activeStep) {
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

  // Render Create Content Form
  const renderCreateContentForm = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            name="name"
            label="Content Name *"
            fullWidth
            value={contentData.name}
            onChange={handleInputChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="code"
            label="Code *"
            fullWidth
            value={contentData.code}
            onChange={handleInputChange}
            required
            margin="normal"
            helperText="Unique identifier for the content"
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
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Content Type *</InputLabel>
            <Select
              name="contentType"
              value={contentData.contentType}
              onChange={handleSelectChange}
              required
            >
              {contentTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Primary Category *</InputLabel>
            <Select
              name="primaryCategory"
              value={contentData.primaryCategory}
              onChange={handleSelectChange}
              required
            >
              {primaryCategories.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
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
              {mimeTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
            <FormHelperText>File type that will be uploaded</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="createdBy"
            label="Created By *"
            fullWidth
            value={contentData.createdBy}
            onChange={handleInputChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="framework"
            label="Framework *"
            fullWidth
            value={contentData.framework}
            onChange={handleInputChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="channel"
            label="Channel *"
            fullWidth
            value={contentData.channel}
            onChange={handleInputChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="organisation"
            label="Organisation(s) *"
            fullWidth
            value={contentData.organisation.join(', ')}
            onChange={handleOrgChange}
            required
            margin="normal"
            helperText="Comma separated list of organisations"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="sequenceId"
            label="Sequence ID"
            fullWidth
            type="number"
            value={contentData.sequenceId}
            onChange={(e) => setContentData({...contentData, sequenceId: parseInt(e.target.value) || 0})}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="redirectUrl"
            label="Redirect URL"
            fullWidth
            value={contentData.redirectUrl}
            onChange={handleInputChange}
            margin="normal"
            InputProps={{
              startAdornment: <InsertLinkIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Resource Category</InputLabel>
            <Select
              name="resourceCategory"
              value={contentData.resourceCategory}
              onChange={handleSelectChange}
            >
              <MenuItem value="Banner">Banner</MenuItem>
              <MenuItem value="Learning Resource">Learning Resource</MenuItem>
              <MenuItem value="Content Resource">Content Resource</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    );
  };

  // Render File Upload Form
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
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography>
                    PDF Preview (Thumbnail only)
                  </Typography>
                  <Box component="img" src="/pdf-icon.png" alt="PDF Icon" sx={{ width: 100, height: 100 }} />
                </Box>
              ) : (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography>
                    File selected: {selectedFile?.name}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  // Render Preview and Update Form
  const renderPreviewAndUpdate = () => {
    if (!uploadResponse?.result?.artifactUrl) {
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
              <Typography><strong>Created By:</strong> {contentData.createdBy}</Typography>
              <Typography><strong>Content ID:</strong> {createResponse?.identifier}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Update Redirect URL</Typography>
              <TextField
                name="redirectUrl"
                label="Redirect URL"
                fullWidth
                value={contentData.redirectUrl}
                onChange={handleInputChange}
                margin="normal"
                InputProps={{
                  startAdornment: <InsertLinkIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>File Preview</Typography>
              
              {previewUrl && contentData.mimeType.startsWith('image/') ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px' }} 
                  />
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Artifact URL: {uploadResponse.result.artifactUrl}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
                  <Typography>
                    File uploaded successfully
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Artifact URL: {uploadResponse.result.artifactUrl}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Upload Content</Typography>
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
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={loading || (activeStep === 0 && (!contentData.name || !contentData.code || !contentData.createdBy))}
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
  );
};