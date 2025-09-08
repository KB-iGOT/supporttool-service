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
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { UserProfile } from '../../../types/users';
import { OrganizationSelector } from './OrganizationSelector';
import { Organization } from './types';

interface UserMigrationDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onMigrate: (userId: string, data: {
    channel: string;
    forceMigration: boolean;
    softDeleteOldOrg: boolean;
    notifyMigration: boolean;
  }) => Promise<void>;
}

export const UserMigrationDialog: React.FC<UserMigrationDialogProps> = ({
  open,
  onClose,
  user,
  onMigrate
}) => {
  // State for form fields
  const [targetOrg, setTargetOrg] = useState<Organization | null>(null);
  const [forceMigration, setForceMigration] = useState(true);
  const [softDeleteOldOrg, setSoftDeleteOldOrg] = useState(true);
  const [notifyMigration, setNotifyMigration] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState({
    targetOrg: false
  });

  // Reset form on dialog open/close
  React.useEffect(() => {
    if (!open) {
      setTargetOrg(null);
      setForceMigration(true);
      setSoftDeleteOldOrg(true);
      setNotifyMigration(false);
      setProcessing(false);
      setError(null);
      setValidationErrors({ targetOrg: false });
    }
  }, [open]);

  const handleTargetOrgSelect = (org: Organization | null) => {
    setTargetOrg(org);
    if (org) {
      setValidationErrors(prev => ({ ...prev, targetOrg: false }));
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!targetOrg) {
      setValidationErrors(prev => ({ ...prev, targetOrg: true }));
      return;
    }

    if (!user || !user.identifier) {
      setError("Invalid user data. Please try again.");
      return;
    }

    // Check if user is already in the target organization
    if (user.channel === targetOrg.channel) {
      setError(`User is already a member of ${targetOrg.channel}`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await onMigrate(user.identifier, {
        channel: targetOrg.channel,
        forceMigration,
        softDeleteOldOrg,
        notifyMigration
      });
      
      // Close dialog on success
      // onClose();
    } catch (err: any) {
      console.error("Migration error:", err);
      setError(err.message || "Failed to migrate user. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => reason !== 'backdropClick' && (processing ? undefined : onClose())}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <CompareArrowsIcon sx={{ mr: 1 }} />
          Migrate User to New Organization
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            User Details:
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Name:</strong> {user?.firstName} {user?.lastName || ''}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {user?.profileDetails?.personalDetails?.primaryEmail || '-'}
              </Typography>
              <Typography variant="body2">
                <strong>User ID:</strong> {user?.identifier || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Current Organization:</strong> {user?.channel || '-'}
              </Typography>
              <Typography variant="body2">
                <strong>Phone:</strong> {user?.profileDetails?.personalDetails?.mobile || '-'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {user?.profileDetails?.profileStatus || '-'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Migration Settings:
        </Typography>
        
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Target Organization:
          </Typography>
          <OrganizationSelector 
            selectedOrg={targetOrg}
            onOrgSelect={handleTargetOrgSelect}
            error={validationErrors.targetOrg}
          />
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Migration Options:
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={forceMigration} 
                onChange={(e) => setForceMigration(e.target.checked)}
                disabled={processing}
              />
            }
            label="Force Migration (Overwrite existing data if conflicts occur)"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={softDeleteOldOrg} 
                onChange={(e) => setSoftDeleteOldOrg(e.target.checked)}
                disabled={processing}
              />
            }
            label="Soft Delete from Old Organization (Preserves data but removes user)"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={notifyMigration} 
                onChange={(e) => setNotifyMigration(e.target.checked)}
                disabled={processing}
              />
            }
            label="Send Migration Notification to User"
            sx={{ display: 'block' }}
          />
        </Box>
        
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            Warning: This action will move the user to a different organization.
          </Typography>
          <Typography variant="body2">
            User data, access permissions, and organization-specific content associations may be affected.
            This action can be disruptive to the user's experience.
          </Typography>
        </Alert>
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
          color="primary"
          onClick={handleSubmit}
          disabled={processing}
          startIcon={processing ? <CircularProgress size={20} /> : <CompareArrowsIcon />}
        >
          {processing ? "Migrating..." : "Migrate User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};