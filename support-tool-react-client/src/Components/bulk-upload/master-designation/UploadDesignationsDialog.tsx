import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';
import { designationService } from '../../../services/designations.service';

interface UploadDesignationsDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadDesignationsDialog: React.FC<UploadDesignationsDialogProps> = ({
  open,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError(null);
      setSuccessMessage(null);
    } else {
      setSelectedFile(null);
      setError('Please select a valid CSV file.');
    }
  };

  const handleUpload = async (auditData: any) => {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await designationService.uploadMasterDesignations(selectedFile, auditData);
      if (response && response.status === 200) {
        setSuccessMessage('File uploaded and designations processed successfully!');
        onUploadSuccess();
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(response?.message || 'Upload failed with an unknown error.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to upload designations.');
    } finally {
      setProcessing(false);
    }
  };

  const { handleAction: handleUploadAction } = useActionInterceptor({
    actionType: 'DESIGNATION_BULK_UPLOAD',
    onComplete: handleUpload,
    getPayload: () => ({ fileName: selectedFile?.name, fileSize: selectedFile?.size }),
  });

  const handleClose = () => {
    if (processing) return;
    setSelectedFile(null);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload Master Designations</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select a CSV file to bulk upload master designations. The file should contain columns for 'name', 'description', and 'status'.
          </Typography>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ mt: 2 }}
            disabled={processing}
          >
            Choose File
            <input
              type="file"
              hidden
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </Button>
          {selectedFile && (
            <Chip label={selectedFile.name} onDelete={() => setSelectedFile(null)} sx={{ ml: 2, mt: 2 }} />
          )}
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          onClick={handleUploadAction}
          variant="contained"
          disabled={!selectedFile || processing}
          startIcon={processing && <CircularProgress size={20} />}
        >
          {processing ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};