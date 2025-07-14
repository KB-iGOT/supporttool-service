import React from 'react';
import { Grid, Card, CardContent, Typography, Alert, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ContentRequest, ContentCreateResponse, ContentUploadResponse } from '../types';
import { extractTime } from '../utils/contentHelpers';
import FilePreviewCard from './FilePreviewCard';

interface ContentPreviewProps {
  contentData: ContentRequest;
  createResponse: ContentCreateResponse | null;
  uploadResponse: ContentUploadResponse | null;
  selectedFile: File | null;
  previewUrl: string | null;
  userId?: string;
  isEditMode?: boolean;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  contentData,
  createResponse,
  uploadResponse,
  selectedFile,
  previewUrl,
  userId,
  isEditMode
}) => {
  if (!uploadResponse?.artifactUrl) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        File upload is required before updating. Please go back and upload a file first.
      </Alert>
    );
  }

  // Determine which fields were edited in edit mode
  const getEditedFields = () => {
    if (!isEditMode) return null;
    
    const editedFields = [];
    
    if (selectedFile) {
      editedFields.push('File');
    }
    if (contentData.endDate) {
      editedFields.push('End Date');
    }
    if (contentData.endTime) {
      editedFields.push('End Time');
    }
    if (contentData.registrationEndDate) {
      editedFields.push('Registration End Date');
    }
    
    if (editedFields.length === 0) return null;
    
    return (
      <Typography color="primary" sx={{ mt: 1 }}>
        Edited fields: {editedFields.join(', ')}
      </Typography>
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="success" sx={{ mb: 2 }}>
          {isEditMode 
            ? 'Content ready for final update. Click "Finish" to save all changes.'
            : 'File uploaded successfully!'}
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
            <Typography><strong>Created By:</strong> {contentData.createdBy || userId || ''}</Typography>
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
            
            {getEditedFields()}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>File Preview</Typography>
            
            <Box sx={{ maxHeight: '300px', overflow: 'hidden' }}>
              <FilePreviewCard 
                previewUrl={previewUrl || uploadResponse.artifactUrl}
                mimeType={contentData.mimeType}
                selectedFile={selectedFile}
                uploadResponse={uploadResponse}
              />
            </Box>

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

export default ContentPreview;