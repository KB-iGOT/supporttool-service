import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { organisationService } from '../../services/organisations.service';
import { JsonEditor } from './../common-components/json-editor/json-editor';
// import axios from 'axios';
// import config from '@config/config';

export const DeleteOrg = () => {
  const [orgName, setOrgName] = useState('');
  const [orgData, setOrgData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleFetchOrg = async () => {
    if (!orgName.trim()) {
      setError('Please enter an organization name');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await organisationService.fetchOrganisationByName(orgName);
      if (response.data && response.data) {
        setOrgData(response.data);
      } else {
        setError('Organization not found');
        setOrgData(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch organization data');
      setOrgData(null);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const handleDeleteClick = () => {
    if (!orgData) return;
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {

      const response = await organisationService.deleteOrganisationById(orgData.id);
      
        if (response.data && response.data) {
            setOrgData({});
        } else {
            setError('Organization not found');
            setOrgData(null);
        }
      
      setSnackbar({
        open: true,
        message: `Organization "${orgName}" has been deleted successfully`,
        severity: 'success'
      });
      
      setOrgData(null);
      setOrgName('');
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to delete organization',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Delete Organization Hierarchy
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            variant="outlined"
            fullWidth
            placeholder="Enter organization name"
            disabled={loading}
          />
          <Button 
            variant="contained" 
            onClick={handleFetchOrg}
            disabled={loading || !orgName.trim()}
            sx={{ minWidth: '120px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Fetch Details'}
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {orgData && Object.keys(orgData).length && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Organization Details
          </Typography>
          
          <Box sx={{ mb: 3, height: '400px' }}>
            <JsonEditor 
              input={orgData} 
              onChange={() => {}} 
              customOptions={{ readOnly: true }}
            />
          </Box>
          
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteClick}
            disabled={loading}
          >
            Delete Organization
          </Button>
        </Paper>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the organization "{orgName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notification */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeleteOrg;