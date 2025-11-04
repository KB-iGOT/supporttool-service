import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { designationService } from '../../../services/designations.service';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';

interface CreateDesignationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDesignationDialog: React.FC<CreateDesignationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [designation, setDesignation] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (auditData: any) => {
    setProcessing(true);
    setError(null);

    const payload = {
      designation,
      description,
      ...auditData,
    };

    try {
      await designationService.createMasterDesignation(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Create error:', err);
      setError(err?.response?.data?.message || 'Failed to create designation.');
    } finally {
      setProcessing(false);
    }
  };

  const { handleAction: handleCreateAction } = useActionInterceptor({
    actionType: 'DESIGNATION_CREATE',
    onComplete: handleCreate,
    getPayload: () => ({ designation, description }),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Master Designation</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            name="designation"
            label="Designation Name"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            name="description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>Cancel</Button>
        <Button onClick={handleCreateAction} variant="contained" disabled={processing || !designation}>
          {processing ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};