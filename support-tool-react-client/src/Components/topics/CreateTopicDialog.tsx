import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
} from '@mui/material';

interface CreateTopicDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (categoryName: string, description: string) => Promise<void>;
  processing: boolean;
}

export const CreateTopicDialog: React.FC<CreateTopicDialogProps> = ({
  open,
  onClose,
  onSubmit,
  processing,
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (categoryName.trim()) {
      await onSubmit(categoryName.trim(), description.trim());
      // Reset form after successful submission
      setCategoryName('');
      setDescription('');
    }
  };

  const handleClose = () => {
    if (!processing) {
      setCategoryName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Topic</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            name="categoryName"
            label="Topic Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            fullWidth
            required
            autoFocus
            disabled={processing}
            placeholder="Enter topic name..."
          />
          <TextField
            name="description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            disabled={processing}
            placeholder="Enter topic description..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={processing || !categoryName.trim()}
          startIcon={processing ? <CircularProgress size={20} /> : null}
        >
          {processing ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
