import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  CircularProgress
} from '@mui/material';
import { OrganizationSelector } from './OrganizationSelector';
import { Organization } from './types';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  processing: boolean;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ 
  open, 
  onClose, 
  onSubmit,
  processing 
}) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<string[]>(['PUBLIC']);
  
  // Validation state
  const [errors, setErrors] = useState({
    firstName: false,
    email: false,
    phone: false,
    channel: false
  });

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFirstName('');
      setEmail('');
      setPhone('');
      setSelectedChannel(null);
      setRoles(['PUBLIC']);
      setErrors({
        firstName: false,
        email: false,
        phone: false,
        channel: false
      });
    }
  }, [open]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const nameValid = firstName.trim().length >= 2;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const emailValid = emailRegex.test(email);
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const phoneValid = phoneRegex.test(phone);
    const channelValid = !!selectedChannel;
    
    setErrors({
      firstName: !nameValid,
      email: !emailValid,
      phone: !phoneValid,
      channel: !channelValid
    });
    
    // If form is valid, submit it
    if (nameValid && emailValid && phoneValid && channelValid) {
      onSubmit({
        firstName: firstName,
        email: email,
        phone: phone,
        channel: selectedChannel.channel,
        orgId: selectedChannel.identifier, // Pass the organization ID
        roles: roles
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => reason !== 'backdropClick' && onClose()}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth>
      <DialogTitle>Create New User</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="firstName"
                label="Full Name"
                name="firstName"
                autoComplete="name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName}
                helperText={errors.firstName ? "Please enter a valid name (at least 2 characters)" : " "}
                disabled={processing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                helperText={errors.email ? "Please enter a valid email address" : " "}
                disabled={processing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                id="phone"
                label="Phone Number"
                name="phone"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                helperText={errors.phone ? "Please enter a valid phone number (10-15 digits)" : " "}
                disabled={processing}
              />
            </Grid>
            <Grid item xs={12}>
              <OrganizationSelector
                selectedOrg={selectedChannel}
                onOrgSelect={setSelectedChannel}
                error={errors.channel}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="roles-label">User Roles</InputLabel>
                <Select
                  labelId="roles-label"
                  id="roles"
                  multiple
                  value={roles}
                  onChange={(e) => setRoles(typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[])}
                  label="User Roles"
                  disabled={true}
                >
                  <MenuItem value="PUBLIC">Public</MenuItem>
                </Select>
                <FormHelperText>Please select at least one role</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
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
          disabled={processing}
          startIcon={processing && <CircularProgress size={20} color="inherit" />}
        >
          {processing ? "Creating..." : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};