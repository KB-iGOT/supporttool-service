import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { UserProfile } from '../../../types/users';

interface UserBlockDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onBlockUser: (userId: string, currentStatus: number, requestedById: string) => Promise<void>;
  currentUserId: string; // ID of the logged-in admin user making the request
}

export const UserBlockDialog: React.FC<UserBlockDialogProps> = ({
  open,
  onClose,
  user,
  onBlockUser,
  currentUserId
}) => {
  // State
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Determine if we're blocking or unblocking based on user status
  const userStatus = user?.status === 1 ? 1 : 0;
  const isBlocking = userStatus === 1;

  // Reset state when dialog closes or changes user
  React.useEffect(() => {
    if (!open) {
      setProcessing(false);
      setError(null);
      setSuccess(false);
    }
  }, [open, user]);

  const handleConfirm = async () => {
    if (!user || !user.identifier) {
      setError("Invalid user data. Please try again.");
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      await onBlockUser(user.identifier, userStatus, currentUserId);
      setSuccess(true);
      
      // Auto-close dialog after successful operation
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("User block/unblock error:", err);
      setError(err.message || `Failed to ${isBlocking ? 'block' : 'unblock'} user. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          {isBlocking ? <BlockIcon sx={{ mr: 1 }} /> : <LockOpenIcon sx={{ mr: 1 }} />}
          {isBlocking ? 'Block User' : 'Unblock User'}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            User has been successfully {isBlocking ? 'blocked' : 'unblocked'}.
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            You are about to {isBlocking ? 'block' : 'unblock'} the following user:
          </Typography>
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body1">
              <strong>Name:</strong> {user?.firstName} {user?.lastName || ''}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {user?.profileDetails?.personalDetails?.primaryEmail || '-'}
            </Typography>
            <Typography variant="body1">
              <strong>Organization:</strong> {user?.rootOrgName || '-'}
            </Typography>
            <Typography variant="body1">
              <strong>Current Status:</strong> {' '}
              <Chip 
                label={user?.status === 1 ? 'Un-blocked': 'Blocked' } 
                color={user?.status === 1 ? 'success' : 'error'}
                size="small"
              />
            </Typography>
          </Box>
          
          {isBlocking ? (
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Blocking this user will:</strong>
              </Typography>
              <ul>
                <li>Prevent them from logging into the system</li>
                <li>Suspend access to all platform features and content</li>
                <li>Keep their account data intact for future restoration</li>
              </ul>
              <Typography variant="body2">
                You can unblock this user at any time to restore their access.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Unblocking this user will:</strong>
              </Typography>
              <ul>
                <li>Restore their ability to log into the system</li>
                <li>Provide full access to platform features based on their roles</li>
                <li>Allow them to resume normal activities</li>
              </ul>
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={processing}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          color={isBlocking ? "error" : "primary"}
          onClick={handleConfirm}
          disabled={processing || success}
          startIcon={
            processing ? <CircularProgress size={20} /> : 
              isBlocking ? <BlockIcon /> : <LockOpenIcon />
          }
        >
          {processing 
            ? "Processing..." 
            : isBlocking 
              ? "Block User" 
              : "Unblock User"
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};