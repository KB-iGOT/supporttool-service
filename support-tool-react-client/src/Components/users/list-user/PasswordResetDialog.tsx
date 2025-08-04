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
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { UserProfile } from '../../../types/users';

interface PasswordResetDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onResetPassword: (userId: string, notificationType: 'email') => Promise<string>;
}

export const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
  open,
  onClose,
  user,
  onResetPassword
}) => {
  // State
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notificationType, setNotificationType] = useState<'email'>('email');

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setProcessing(false);
      setError(null);
      setResetLink(null);
      setCopied(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!user || !user.identifier) {
      setError("Invalid user data. Please try again.");
      return;
    }

    setProcessing(true);
    setError(null);
    setResetLink(null);

    try {
      const link = await onResetPassword(user.identifier, notificationType);
      setResetLink(link);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyLink = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink)
        .then(() => {
          setCopied(true);
          // Reset the copied state after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          setError('Failed to copy link to clipboard');
        });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <LockResetIcon sx={{ mr: 1 }} />
          Reset User Password
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!resetLink ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                You are about to reset the password for:
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
              </Box>
              <Alert severity="warning">
                <Typography variant="body2">
                  This action will invalidate the user's current password and send them a password reset link.
                  They will need to create a new password to access the system.
                </Typography>
              </Alert>
            </Box>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="notification-type-label">Notification Method</InputLabel>
              <Select
                labelId="notification-type-label"
                id="notification-type"
                value={notificationType}
                label="Notification Method"
                onChange={(e) => setNotificationType(e.target.value as 'email')}
                disabled={processing}
              >
                <MenuItem value="email">Email</MenuItem>
              </Select>
              <FormHelperText>
                The user will receive the password reset link via this method
              </FormHelperText>
            </FormControl>
          </>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset link generated successfully!
            </Alert>
            
            <Typography variant="body1" gutterBottom>
              The password reset link has been sent to the user's email. You can also copy the link below:
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                value={resetLink}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                      <IconButton onClick={handleCopyLink} edge="end">
                        {copied ? <CheckCircleIcon color="success" /> : <ContentCopyIcon />}
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This link will expire after 72 hours. The user will need to create a new password when they click the link.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={processing}
        >
          {resetLink ? 'Close' : 'Cancel'}
        </Button>
        
        {!resetLink && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <LockResetIcon />}
          >
            {processing ? 'Processing...' : 'Reset Password'}
          </Button>
        )}
        
        {resetLink && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCopyLink}
            startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};