import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import { ContentUploadResponse } from '../types';
import { getFormattedFileSize } from '../utils/fileHelpers';

interface FilePreviewCardProps {
  previewUrl: string;
  mimeType: string;
  selectedFile: File | null;
  uploadResponse: ContentUploadResponse | null;
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  previewUrl,
  mimeType,
  selectedFile,
  uploadResponse
}) => {
  // Image preview
  if (mimeType.startsWith('image/')) {
    return (
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center', maxHeight: '400px', overflow: 'hidden' }}>
        <img
          src={previewUrl}
          alt="Preview"
          style={{ maxWidth: '100%', maxHeight: '350px' }}
        />
      </Paper>
    );
  }
  
  // PDF preview
  if (mimeType === 'application/pdf') {
    if (selectedFile && !uploadResponse) {
      // Show selected PDF file preview placeholder
      return (
        <Paper elevation={3} sx={{ p: 2, textAlign: 'center', maxHeight: '400px', overflow: 'hidden' }}>
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
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ({getFormattedFileSize(selectedFile.size)})
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              PDF preview will be available after upload
            </Typography>
          </Box>
        </Paper>
      );
    } else {
      // Show existing PDF in iframe
      return (
        <Paper elevation={3} sx={{ p: 2, textAlign: 'center', maxHeight: '400px', overflow: 'hidden' }}>
          <Box sx={{ textAlign: 'center', height: '350px', overflow: 'hidden' }}>
            <iframe
              src={previewUrl}
              title="PDF Preview"
              width="100%"
              height="350px"
              style={{ border: 'none' }}
            >
              <Typography color="text.secondary">
                PDF preview not available. You can view it using the artifact URL.
              </Typography>
            </iframe>
          </Box>
        </Paper>
      );
    }
  }
  
  // Video preview
  if (mimeType.startsWith('video/')) {
    return (
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center', maxHeight: '400px', overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <video 
            controls 
            width="100%" 
            height="auto" 
            style={{ maxHeight: '350px' }}
          >
            <source src={previewUrl} type={mimeType} />
            Your browser does not support the video tag.
          </video>
        </Box>
      </Paper>
    );
  }
  
  // Other file types
  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', maxHeight: '400px', overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography>
          {selectedFile ? `File selected: ${selectedFile.name}` : 
            uploadResponse?.artifactUrl ? 'Current file is available for download' : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Preview not available for this file type.
        </Typography>
        {uploadResponse?.artifactUrl && !selectedFile && (
          <Button 
            href={uploadResponse.artifactUrl} 
            target="_blank"
            variant="outlined"
            color="primary"
            startIcon={<InsertLinkIcon />}
            sx={{ mt: 2 }}
          >
            View/Download File
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default FilePreviewCard;