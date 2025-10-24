import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { designationService } from '../../../services/designations.service';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';

interface MasterDesignation {
  id: string;
  designation: string;
  description: string;
  status: string;
  [key: string]: any; // Allow other properties
}

interface UpdateDesignationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  designation: MasterDesignation | null;
}

export const UpdateDesignationDialog: React.FC<UpdateDesignationDialogProps> = ({
  open,
  onClose,
  onSuccess,
  designation,
}) => {
  const [formData, setFormData] = useState<Partial<MasterDesignation>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (designation) {
      setFormData({
        designation: designation.designation,
        description: designation.description,
        status: designation.status,
      });
    }
  }, [designation]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleUpdate = async (auditData: any) => {
    if (!designation) return;

    setProcessing(true);
    setError(null);

    const requestPayload = {
      ...designation,
      ...formData,
    };

    try {
      await designationService.updateDesignation(requestPayload, auditData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err?.response?.data?.message || 'Failed to update designation.');
    } finally {
      setProcessing(false);
    }
  };

  const { handleAction: handleUpdateAction } = useActionInterceptor({
    actionType: 'DESIGNATION_UPDATE',
    onComplete: handleUpdate,
    getPayload: () => ({
      designationId: designation?.id,
      previousData: {
        designation: designation?.designation,
        description: designation?.description,
        status: designation?.status,
      },
      updatedData: formData,
    }),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Update Designation</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            name="designation"
            label="Designation Name"
            value={formData.designation || ''}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            name="description"
            label="Description"
            value={formData.description || ''}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select name="status" value={formData.status || ''} label="Status" onChange={handleChange as any}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>Cancel</Button>
        <Button onClick={handleUpdateAction} variant="contained" disabled={processing}>
          {processing ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};