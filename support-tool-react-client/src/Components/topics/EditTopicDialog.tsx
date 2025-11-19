import React, { useState, useEffect } from 'react';
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

interface Topic {
  categoryId: number;
  categoryName: string;
  description: string;
  parentId?: number;
  createdAt: string;
  lastUpdatedAt: string;
  departmentId: string;
  countOfCommunities: number;
  status: string;
}

interface EditTopicDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (updatedTopic: any) => Promise<void>;
  topic: Topic | null;
  loading: boolean;
}

const EditTopicDialog: React.FC<EditTopicDialogProps> = ({
  open,
  onClose,
  onSubmit,
  topic,
  loading,
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (topic) {
      setCategoryName(topic.categoryName || '');
      setDescription(topic.description || '');
    }
  }, [topic]);

  const handleSubmit = async () => {
    if (topic && categoryName.trim()) {
      const updatedTopic = {
        categoryId: topic.categoryId,
        categoryName: categoryName.trim(),
        description: description.trim(),
      };
      await onSubmit(updatedTopic);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Topic</DialogTitle>
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
            disabled={loading}
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
            disabled={loading}
            placeholder="Enter topic description..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !categoryName.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTopicDialog;
