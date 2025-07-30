import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Button,
  Typography,
  CircularProgress,
  FormHelperText,
  OutlinedInput,
  SelectChangeEvent,
  Alert
} from "@mui/material";
import { usersService } from "../../../services/users.service";
import { UserProfile } from "../../../types/users";
import { organisationService } from "../../../services/organisations.service";
import { rolesService } from "../../../services/roles.service";

interface OrgType {
  name: string;
  roles: string[];
  subTypeList?: string[];
  flags: string[];
  isHidden: boolean;
}

interface RoleAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onRoleAssign: (userId: string, orgId: string, roles: string[], initialRoles:string[]) => Promise<void>;
}

export const RoleAssignmentDialog: React.FC<RoleAssignmentDialogProps> = ({
  open,
  onClose,
  user,
  onRoleAssign
}) => {
  const [orgTypes, setOrgTypes] = useState<OrgType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [initialRoles, setInitialRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mdoLeaderWarning, setMdoLeaderWarning] = useState<boolean>(false);
  const [checkingMdoLeader, setCheckingMdoLeader] = useState<boolean>(false);
  const [userAlreadyHasMdoLeader, setUserAlreadyHasMdoLeader] = useState<boolean>(false);

  // Fetch organization types and their roles
  useEffect(() => {
    if (open && user) {
      fetchOrgTypeList();
      
      let initialUserRoles: string[] = [];
      
      // Initialize selected roles from user data
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        // If roles array is directly available and not empty
        initialUserRoles = [...user.roles];
        setSelectedRoles(initialUserRoles);
        setInitialRoles(initialUserRoles);
        
        // Check if MDO_LEADER is already selected and included in initial roles
        if (user.roles.includes('MDO_LEADER')) {
          setUserAlreadyHasMdoLeader(true);
          checkMdoLeaderExists(user.rootOrgId, user.identifier);
        }
      } else if (user.organisations && Array.isArray(user.organisations)) {
        // Look for roles in the organizations array matching the user's rootOrgId
        const orgWithRoles = user.organisations.find(
          (org) => org.organisationId === user.rootOrgId
        );
        
        if (orgWithRoles && orgWithRoles.roles && Array.isArray(orgWithRoles.roles)) {
          initialUserRoles = [...orgWithRoles.roles];
          setSelectedRoles(initialUserRoles);
          setInitialRoles(initialUserRoles);
          
          // Check if MDO_LEADER is already selected and included in initial roles
          if (orgWithRoles.roles.includes('MDO_LEADER')) {
            setUserAlreadyHasMdoLeader(true);
            checkMdoLeaderExists(user.rootOrgId, user.identifier);
          }
        } else {
          // If no matching organization or no roles in matching organization
          initialUserRoles = ['PUBLIC'];
          setSelectedRoles(initialUserRoles);
          setInitialRoles(initialUserRoles);
        }
      } else {
        // If no roles information is available at all
        initialUserRoles = ['PUBLIC'];
        setSelectedRoles(initialUserRoles);
        setInitialRoles(initialUserRoles);
      }
    } else {
      // Reset states when dialog closes
      setSelectedRoles([]);
      setInitialRoles([]);
      setUserAlreadyHasMdoLeader(false);
      setMdoLeaderWarning(false);
    }
  }, [open, user]);

  // Effect to check for MDO_LEADER when roles change
  useEffect(() => {
    if (!user) return;
    
    const hadMdoLeaderInitially = initialRoles.includes('MDO_LEADER');
    const hasMdoLeaderNow = selectedRoles.includes('MDO_LEADER');
    
    // Only check if MDO_LEADER is newly added (wasn't there initially)
    if (hasMdoLeaderNow && !hadMdoLeaderInitially) {
      checkMdoLeaderExists(user.rootOrgId, user.identifier);
    } else if (!hasMdoLeaderNow) {
      // If MDO_LEADER is removed, clear the warning
      setMdoLeaderWarning(false);
    }
  }, [selectedRoles, initialRoles, user]);

  const checkMdoLeaderExists = async (orgId: string, currentUserId: string) => {
    if (!orgId) return;
    
    try {
      setCheckingMdoLeader(true);
      const request = {
        request: {
          filters: {
            status: 1,
            rootOrgId: orgId,
            "organisations.roles": ["MDO_LEADER"]
          },
          limit: 0,
          fields: []
        }
      };
      
      const response = await usersService.getUsers(request);
      
      if (response?.result?.response?.count > 0) {
        // Check if another user has MDO_LEADER role
        // If the current user already had MDO_LEADER role initially, don't show warning
        if (!userAlreadyHasMdoLeader) {
          setMdoLeaderWarning(true);
        } else {
          setMdoLeaderWarning(false);
        }
      } else {
        setMdoLeaderWarning(false);
      }
    } catch (error) {
      console.error("Error checking MDO_LEADER status:", error);
    } finally {
      setCheckingMdoLeader(false);
    }
  };

  const fetchOrgTypeList = async () => {
    try {
      setLoading(true);
      const response = await rolesService.fetchIgotRoles();
      
      if (response?.responseCode !== 'OK') {
        throw new Error('Failed to fetch organization types');
      }
      
      if(response?.result?.result?.response) {
        const data = await response?.result?.result?.response;
        if (data && data.id === "orgTypeList" && data.value) {
          const parsedData = JSON.parse(data.value);
          if (parsedData.orgTypeList && Array.isArray(parsedData.orgTypeList)) {
            setOrgTypes(parsedData.orgTypeList);
            
            // Extract all available roles from all org types
            const allRoles = parsedData.orgTypeList.reduce((acc: string[], orgType: OrgType) => {
              if (orgType.roles && Array.isArray(orgType.roles)) {
                return [...acc, ...orgType.roles];
              }
              return acc;
            }, []);
            
            // Remove duplicates
            setAvailableRoles(Array.from(new Set(allRoles)).sort() as string[]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching org type list:', error);
      setError('Failed to load role information');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<typeof selectedRoles>) => {
    const {
      target: { value },
    } = event;
    
    // On autofill we get a stringified value.
    const newSelectedRoles = typeof value === 'string' ? value.split(',') : value;
    setSelectedRoles(newSelectedRoles);
    
    // MDO_LEADER check will be handled by the useEffect watching selectedRoles
  };

  const handleSubmit = async () => {
    if (!user || !user.identifier || !user.rootOrgId) {
      setError('User information is incomplete');
      return;
    }
    
    // If attempting to assign MDO_LEADER role to a user in an org that already has one
    // and the user didn't already have this role
    if (mdoLeaderWarning && selectedRoles.includes('MDO_LEADER') && !initialRoles.includes('MDO_LEADER')) {
      const confirmAssignment = window.confirm(
        "MDO Leader role has already been allocated to another user from the Ministry. Are you sure you want to assign this role to this user? This may cause conflicts."
      );
      if (!confirmAssignment) {
        return;
      }
    }
    
    try {
      setLoading(true);
      await onRoleAssign(user.identifier, user.rootOrgId, selectedRoles,initialRoles);
      
      // Add a small delay to ensure the server has time to process the update
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error assigning roles:', error);
      setError('Failed to assign roles');
    } finally {
      setLoading(false);
    }
  };

  // Determine if the Save button should be disabled
  const isSaveButtonDisabled = () => {
    // Basic validations
    if (loading || checkingMdoLeader || selectedRoles.length === 0) {
      return true;
    }
    
    // Special case for MDO_LEADER warning
    if (mdoLeaderWarning && selectedRoles.includes('MDO_LEADER') && !initialRoles.includes('MDO_LEADER')) {
      return true;
    }
    
    return false;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Manage User Roles
        {user && (
          <Typography variant="subtitle2" color="text.secondary" component="span">
            {user.firstName} {user.lastName} ({user.profileDetails?.personalDetails?.primaryEmail || ''})
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {loading && <CircularProgress size={24} sx={{ display: 'block', margin: '20px auto' }} />}
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {mdoLeaderWarning && selectedRoles.includes('MDO_LEADER') && !initialRoles.includes('MDO_LEADER') && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            MDO Leader role has already been allocated to another user from the Ministry; 
            kindly revise the role for that user before assigning a different user as an MDO Leader.
          </Alert>
        )}
        
        {!loading && (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth error={selectedRoles.length === 0}>
              <InputLabel id="role-select-label">Assigned Roles</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                multiple
                value={selectedRoles}
                onChange={handleRoleChange}
                input={<OutlinedInput label="Assigned Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {availableRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
              {selectedRoles.length === 0 && (
                <FormHelperText>Please select at least one role</FormHelperText>
              )}
            </FormControl>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Organization Types and Available Roles:
            </Typography>
            
            {orgTypes.filter(type => !type.isHidden).map((type) => (
              <Box key={type.name} sx={{ mt: 2 }}>
                <Typography variant="subtitle2">{type.name}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 2 }}>
                  {type.roles.map((role) => (
                    <Chip 
                      key={role} 
                      label={role} 
                      variant={selectedRoles.includes(role) ? "filled" : "outlined"} 
                      color={selectedRoles.includes(role) ? "primary" : "default"}
                      size="small"
                      onClick={() => {
                        if (selectedRoles.includes(role)) {
                          setSelectedRoles(selectedRoles.filter(r => r !== role));
                        } else {
                          setSelectedRoles([...selectedRoles, role]);
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading || checkingMdoLeader}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={
            loading || 
            checkingMdoLeader || 
            selectedRoles.length === 0 || 
            (mdoLeaderWarning && selectedRoles.includes('MDO_LEADER') && !initialRoles.includes('MDO_LEADER'))
          }
        >
          {loading || checkingMdoLeader ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};