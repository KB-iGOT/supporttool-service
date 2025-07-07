import React, { useRef } from 'react';
import { Grid, Box, Typography, Button, Alert, Paper, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import { ContentCreateResponse, ContentUploadResponse } from '../types';
import FilePreviewCard from './FilePreviewCard';

interface FileUploadFormProps {
  createResponse: ContentCreateResponse | null;
  uploadResponse: ContentUploadResponse | null;
  selectedFile: File | null;
  previewUrl: string | null;
  mimeType: string;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  isEditMode?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const FileUploadForm: React.FC<FileUploadFormProps> = ({
  createResponse,
  uploadResponse,
  selectedFile,
  previewUrl,
  mimeType,
  handleFileSelect,
  handleRemoveFile,
  isEditMode,
  fileInputRef
}) => {
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
          {isEditMode ? 'Edit mode: You can upload a new file to replace the existing one' : 'Content created successfully!'} 
          <br />Content ID: {createResponse?.identifier}
        </Alert>
      </Grid>

      {uploadResponse?.artifactUrl && (
        <Grid item xs={12}>
          <Alert severity="success" sx={{ mb: 2 }}>
            File {isEditMode ? 'already exists' : 'already uploaded'}. You can proceed to the next step or select a new file to replace it.
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
          >
            {uploadResponse?.artifactUrl ? 'Replace File' : 'Select File'}
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
            
            {isEditMode && (
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                Click "Upload & Update" to save this file to the server
              </Typography>
            )}
          </Box>
        )}

        {uploadResponse?.artifactUrl && !selectedFile && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              Current File: {uploadResponse.artifactUrl.split('/').pop() || 'Uploaded file'}
            </Typography>
          </Box>
        )}
      </Grid>

      {/* Show preview for selected new file OR existing artifact */}
      {(previewUrl || uploadResponse?.artifactUrl) && (
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Preview</Typography>
          <FilePreviewCard 
            previewUrl={previewUrl || uploadResponse?.artifactUrl || ''} 
            mimeType={mimeType}
            selectedFile={selectedFile}
            uploadResponse={uploadResponse}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default FileUploadForm;