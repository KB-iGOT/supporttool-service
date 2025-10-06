import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { UserProfile } from '../../../types/users';
import { usersService } from '../../../services/users.service';
import { DesignationSelector } from './DesignationSelector';

interface EditPrimaryDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSubmit: (details: any) => void;
  processing: boolean;
}

interface Designation {
  name: string;
  identifier: string;
}

export const EditPrimaryDetailsDialog: React.FC<EditPrimaryDetailsDialogProps> = ({
  open,
  onClose,
  user,
  onSubmit,
  processing
}) => {
  // Form state
  const [group, setGroup] = useState('');
  const [designation, setDesignation] = useState<Designation | null>(null);

  // Group state
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);

  const [errors, setErrors] = useState({
    group: false,
    designation: false
  });

  const hasPendingGroupRequest = user && (user as any).wfProfileGroupRequest && Object.keys((user as any).wfProfileGroupRequest).length > 0;
  const hasPendingDesignationRequest = user && (user as any).wfProfileDesignationRequest && Object.keys((user as any).wfProfileDesignationRequest).length > 0;
  const hasPendingTransferRequest = user && (user as any).wfTransferRequest && Object.keys((user as any).wfTransferRequest).length > 0;

  const hasAnyPendingRequest = hasPendingGroupRequest || hasPendingDesignationRequest || hasPendingTransferRequest;

  // If a transfer is pending, disable everything.
  const isFormDisabled = hasPendingTransferRequest;

  const isGroupDisabled = processing || groupLoading || hasPendingGroupRequest || isFormDisabled;
  const isDesignationDisabled = processing || hasPendingDesignationRequest || isFormDisabled;
  const isSubmitDisabled = processing || isFormDisabled || (isGroupDisabled && isDesignationDisabled);

  // Populate form with user's current data
  useEffect(() => {
    if (user) {
      setGroup((user.profileDetails as any)?.professionalDetails?.[0]?.group || '');
      const currentDesignation = (user.profileDetails as any)?.professionalDetails?.[0]?.designation;
      if (currentDesignation) {
        // We don't have the full designation object, so we create a placeholder
        const userDesignation = { name: currentDesignation, identifier: '' };
        setDesignation(userDesignation);
      }
      fetchGroups();
    }
  }, [user]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    setGroupLoading(true);
    try {
      const response = await usersService.fetchGroups();
      if (response.result?.response) {
        setGroupOptions(response.result.response);
      } else {
        setGroupOptions([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroupOptions([]);
      // Optionally set an error state to show in the UI
    } finally {
      setGroupLoading(false);
    }
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setGroup('');
      setGroupOptions([]);
      setGroupLoading(false);
      setDesignation(null);
      setErrors({ group: false, designation: false });
    }
  }, [open]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const groupValid = group.trim().length > 0;
    const designationValid = !!designation;

    setErrors({
      group: !groupValid,
      designation: !designationValid
    });

    if (groupValid && designationValid) {
      onSubmit({
        group,
        designation: designation.name
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => reason !== 'backdropClick' && onClose()}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Primary Details</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: {user?.firstName} ({user?.profileDetails?.personalDetails?.primaryEmail})
              </Typography>
              <FormControl fullWidth required error={errors.group} disabled={isGroupDisabled}>
                <InputLabel id="group-select-label">Group</InputLabel>
                <Select
                  labelId="group-select-label"
                  id="group"
                  value={group}
                  label="Group"
                  onChange={(e) => setGroup(e.target.value)}
                >
                  {groupLoading ? (
                    <MenuItem value="" disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Loading groups...
                    </MenuItem>
                  ) : (
                    groupOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))
                  )}
                </Select>
                {errors.group && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>Group is required</Typography>}
              </FormControl>
              <DesignationSelector
                user={user}
                selectedDesignation={designation}
                onDesignationSelect={setDesignation}
                error={errors.designation}
                disabled={isDesignationDisabled}
              />
          </Box>
          {hasAnyPendingRequest ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {(() => {
                if (hasPendingTransferRequest) {
                  return "A transfer request for this user is pending with the MDO. All fields are disabled until it is resolved. Please contact your MDO for more information.";
                }

                const pendingItems: string[] = [];
                if (hasPendingGroupRequest) {
                  pendingItems.push("group");
                }
                if (hasPendingDesignationRequest) {
                  pendingItems.push("designation");
                }

                if (pendingItems.length > 0) {
                  return `A request to update the user's ${pendingItems.join(' and ')} is already pending with the MDO. The respective field(s) are disabled. Please contact your MDO for more information.`;
                }
                return "A request to update this user's details is already pending with the MDO. Please contact your MDO for more information.";
              })()}
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Updating these details will affect the user's professional profile information.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitDisabled}
          startIcon={processing && <CircularProgress size={20} color="inherit" />}
        >
          {processing ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};