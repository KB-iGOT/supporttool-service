import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { UserProfile } from '../../../types/users';

interface UserStatusUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onConfirm: (userId: string, newStatus: 'NOT-MY-USER' | 'NOT-VERIFIED') => Promise<void>;
}

export const UserStatusUpdateDialog: React.FC<UserStatusUpdateDialogProps> = ({
  open,
  onClose,
  user,
  onConfirm
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNotMyUserAction = user?.profileDetails?.profileStatus === 'NOT-VERIFIED';
  const newStatus = isNotMyUserAction ? 'NOT-MY-USER' : 'NOT-VERIFIED';
  const title = isNotMyUserAction ? 'Mark as "Not My User"?' : 'Reassign User?';
  const Icon = isNotMyUserAction ? ReportProblemIcon : AssignmentTurnedInIcon;

  useEffect(() => {
    if (!open) {
      setProcessing(false);
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!user || !user.identifier) {
      setError("Invalid user data. Please try again.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await onConfirm(user.identifier, newStatus);
      onClose();
    } catch (err: any) {
      console.error("User status update error:", err);
      setError(err.message || `Failed to update user status. Please try again.`);
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
          <Icon sx={{ mr: 1 }} />
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography>
          Are you sure you want to change the status of user <strong>{user?.firstName}</strong> ({user?.profileDetails?.personalDetails?.primaryEmail}) to <strong>{newStatus}</strong>?
        </Typography>
        {isNotMyUserAction && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action indicates that the user does not belong to the current organization.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={isNotMyUserAction ? "warning" : "primary"}
          onClick={handleConfirm}
          disabled={processing}
          startIcon={processing ? <CircularProgress size={20} /> : <Icon />}
        >
          {processing ? "Processing..." : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};