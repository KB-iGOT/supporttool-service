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
import { AppContext } from '../../Context/AppContext';
import { appContextType } from '../../types';
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

  // Get permissions from context
  const { checkPermissions } = React.useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

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
    // Check permissions before showing delete confirmation dialog
    if (!permissions.canDelete) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to delete organizations',
        severity: 'error'
      });
      return;
    }
    
    if (!orgData) return;
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDeleteConfirm = async () => {
    // Double-check permissions before proceeding with deletion
    if (!permissions.canDelete) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to delete organizations',
        severity: 'error'
      });
      setOpenDialog(false);
      return;
    }
    
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
        {/* Use Grid container for better responsiveness */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: '100%'
          }}
        >
          <TextField
            label="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            variant="outlined"
            fullWidth
            placeholder="Enter organization name"
            disabled={loading}
            sx={{ flexGrow: 1 }}
          />
          <Button 
            variant="contained" 
            onClick={handleFetchOrg}
            disabled={loading || !orgName.trim()}
            sx={{ 
              minWidth: '120px',
              height: { xs: '40px', sm: '56px' },
              alignSelf: { sm: 'flex-start' } 
            }}
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
      {orgData && Object.keys(orgData).length > 0 && (
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
            disabled={loading || !permissions.canDelete}
            sx={{
              opacity: permissions.canDelete ? 1 : 0.6,
              pointerEvents: permissions.canDelete ? 'auto' : 'none',
              position: 'relative'
            }}
          >
            Delete Organization
            {!permissions.canDelete && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: 'inherit'
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  No permission
                </Typography>
              </Box>
            )}
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