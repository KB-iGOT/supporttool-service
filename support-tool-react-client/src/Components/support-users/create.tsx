import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import { ICreateUser, User } from "../../types/users";
import DEFAULT from "../../Config/Defaults";
import { rolesService } from "../../services/roles.service";
import { usersService } from "../../services/users.service";

interface Permission {
  module_id: string;
  module_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

interface RolePermissions {
  role: {
    id: string;
    name: string;
  };
  permissions: Permission[];
}

const CreateSupportUser: React.FC<{
  open: { visible: boolean; edit: boolean; user: User | null };
  rolesList: any;
  handleClose: () => void;
  handleSubmit: (fields: ICreateUser, type: string) => void;
}> = ({ open, handleClose, handleSubmit, rolesList }) => {
  const [fields, setFields] = React.useState<ICreateUser>(DEFAULT.CREATE_USER);
  const [email, setEmail] = React.useState<string>("");
  const [emailError, setEmailError] = React.useState<string>("");
  const [userDetailsFetched, setUserDetailsFetched] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = React.useState<{[key: string]: RolePermissions}>({});
  const [toast, setToast] = React.useState<{message: string, open: boolean, severity: "error" | "info" | "success" | "warning"}>({
    message: "",
    open: false,
    severity: "info"
  });

  const handleToastClose = () => {
    setToast({
      ...toast,
      open: false
    });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (!value) {
      setEmailError("Email is required");
    } else if (!validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const fetchUserDetails = async () => {
    if (!email || emailError) return;
    
    setIsLoading(true);
    try {
      let request = {
        "request": {
            "filters": {
                "email":email
            },
            "fields": []
        }
      };
      const response = await usersService.getUserByEmail(request);
      
      if (response && response.responseCode === "OK") {
        if(response.result && response.result.response.content && response.result.response.content.length) {
          let userDetails = response.result.response.content[0];
        
          setFields({
            userId: userDetails?.userId,
            userName: userDetails?.userName || email,
            firstName: userDetails?.firstName || "",
            lastName: userDetails?.lastName || "",
            email:email|| '',
            roles: [],
          });
          setUserDetailsFetched(true);
          setToast({
            message: "User details fetched successfully",
            open: true,
            severity: "success",
          });
        } else {
          setToast({
            message: "User not found in the IGot system",
            open: true,
            severity: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setToast({
        message: "Failed to fetch user details",
        open: true,
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newRoles = typeof value === 'string' ? [value] : value;
    
    setFields({ 
      ...fields, 
      roles: newRoles
    });
    
    // Fetch permissions for any newly selected roles
    newRoles.forEach((roleId: string) => {
      if (!selectedRolePermissions[roleId]) {
        getRolePermission(roleId);
      }
    });
  };

  React.useEffect(() => {
    if (open.edit && open.user) {
      // Extract just the role IDs from the roles array for the Select component
      const roleIds = open.user.roles && Array.isArray(open.user.roles) 
        ? open.user.roles.map(role => role.role_id) 
        : [];
        
      setFields({
        userId: open.user.userId,
        userName: open.user.userName,
        firstName: open.user.firstName,
        lastName: open.user.lastName,
        email: open.user.email || "",
        roles: roleIds, // Store only the IDs in the form state
      });
      setEmail(open.user.email || "");
      setUserDetailsFetched(true);
      
      // Fetch permissions for existing roles when editing
      if (open.user.roles && Array.isArray(open.user.roles)) {
        open.user.roles.forEach((role: any) => {
          if (role && role.role_id && !selectedRolePermissions[role.role_id]) {
            getRolePermission(role.role_id);
          }
        });
      }
    } else {
      setFields(DEFAULT.CREATE_USER);
      setEmail("");
      setUserDetailsFetched(false);
      setEmailError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const getRolePermission = async (roleId: any) => {
    try {
      const response = await rolesService.getRolePermissions(roleId);
      if (response && response.responseCode === "OK") {
        setSelectedRolePermissions(prev => ({
          ...prev,
          [roleId]: {
            role: response.role,
            permissions: response.permissions || []
          }
        }));
      } else {
        throw new Error(response?.responseMessage || "Failed to fetch role permissions");
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      setToast({
        message: "Failed to load role permissions",
        open: true,
        severity: "error",
      });
    }
  };

  const renderRolePermissionsInfo = () => {
    if (!fields.roles || fields.roles.length === 0) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          pb: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          <Box component="span" sx={{ fontWeight: 500, fontSize: '1rem' }}>
            Role Permissions
          </Box>
        </Box>
        
        {fields.roles.map((roleId: string) => {
          const roleData = selectedRolePermissions[roleId];
          
          if (!roleData) {
            return (
              <Box 
                key={roleId} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 2, 
                  mb: 2, 
                  bgcolor: 'rgba(0, 0, 0, 0.03)', 
                  borderRadius: 1 
                }}
              >
                <CircularProgress size={20} sx={{ mr: 1.5 }} />
                <Box>Loading permissions for this role...</Box>
              </Box>
            );
          }
          
          const roleName = roleData.role.name;
          return (
            <Box 
              key={roleId} 
              sx={{ 
                mb: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              <Box sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                p: 1.5, 
                fontWeight: 'bold',
                fontSize: '0.95rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {roleName}
                <Chip 
                  size="small" 
                  label="Role" 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }} 
                />
              </Box>
              
              {roleData.permissions.length === 0 ? (
                <Box sx={{ p: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                  No permissions defined for this role
                </Box>
              ) : (
                <Box sx={{ p: 1.5 }}>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 1.5 
                  }}>
                    {roleData.permissions.map((perm, idx) => (
                      <Box 
                        key={idx} 
                        sx={{ 
                          p: 1.5,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            borderColor: 'primary.light'
                          }
                        }}
                      >
                        <Box sx={{ 
                          fontWeight: 500, 
                          mb: 1,
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {perm.module_name}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          {perm.can_read && 
                            <Chip 
                              size="small" 
                              label="Read" 
                              color="primary" 
                              sx={{ height: '22px', fontSize: '0.7rem' }}
                            />
                          }
                          {perm.can_write && 
                            <Chip 
                              size="small" 
                              label="Write" 
                              color="secondary"
                              sx={{ height: '22px', fontSize: '0.7rem' }}
                            />
                          }
                          {perm.can_delete && 
                            <Chip 
                              size="small" 
                              label="Delete" 
                              color="error"
                              sx={{ height: '22px', fontSize: '0.7rem' }}
                            />
                          }
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <React.Fragment>
      {/* Toast notification */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={6000} 
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleToastClose} 
          severity={toast.severity} 
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={open.visible}
        onClose={handleClose}
        slotProps={{
          paper: {
            component: "form",
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              handleSubmit(fields, open.edit ? "edit" : "create");
            },
          },
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="padding-1-2">
          {open.edit ? "Edit support user" : "Add new support user"}
        </DialogTitle>
        <DialogContent className="dialog-content-container">
          <DialogContentText>
            Provide user's email. Please note that the user's email should be
            available in the IGot system to add them here.
          </DialogContentText>
          
          {/* Email field with fetch button - FIXED ALIGNMENT */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FormControl fullWidth error={!!emailError}>
              <TextField
                autoFocus
                autoComplete="off"
                required
                margin="dense"
                id="email"
                name="email"
                label="User Email"
                type="email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={handleEmailChange}
                disabled={open.edit || userDetailsFetched}
                error={!!emailError}
                helperText={emailError}
              />
            </FormControl>
            {!open.edit && !userDetailsFetched && (
              <Button 
                variant="contained" 
                onClick={fetchUserDetails}
                disabled={!email || !!emailError || isLoading}
                sx={{ minWidth: '120px', height: '56px', ml: 1 }}
              >
                {isLoading ? <CircularProgress size={24} /> : "Fetch Details"}
              </Button>
            )}
          </Box>
          
          {/* Show user details fields after fetching */}
          {userDetailsFetched && (
            <>
              <FormControl fullWidth>
                <TextField
                  autoComplete="off"
                  required
                  margin="dense"
                  id="userId"
                  name="userId"
                  label="User ID"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={fields.userId}
                  disabled
                />
              </FormControl>
              
              {/* Added User Name field */}
              <FormControl fullWidth>
                <TextField
                  autoComplete="off"
                  required
                  margin="dense"
                  id="userName"
                  name="userName"
                  label="User Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={fields.userName}
                  disabled
                />
              </FormControl>
              
              <FormControl fullWidth>
                <TextField
                  autoComplete="off"
                  required
                  margin="dense"
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={fields.firstName}
                  disabled
                />
              </FormControl>
              
              {/* Only show Last Name if it exists */}
              {fields.lastName && (
                <FormControl fullWidth>
                  <TextField
                    autoComplete="off"
                    margin="dense"
                    id="lastName"
                    name="lastName"
                    label="Last Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={fields.lastName}
                    disabled
                  />
                </FormControl>
              )}

              <FormControl fullWidth>
                <InputLabel id="roles-label" required>
                  Assign role(s)
                </InputLabel>
                <Select
                  labelId="roles-label"
                  id="roles"
                  multiple
                  value={fields.roles || []}
                  label="Assign role(s)"
                  onChange={handleRoleChange}
                  required
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((roleId) => {
                        const roleItem = rolesList?.find((r: any) => r.id === roleId);
                        return <Chip key={roleId} label={roleItem ? roleItem.name : roleId} />;
                      })}
                    </Box>
                  )}
                >
                  {(rolesList && rolesList.length) && rolesList.map((role: any) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Display permissions information */}
              {renderRolePermissionsInfo()}
            </>
          )}
        </DialogContent>
        <DialogActions className="padding-1-2">
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          {userDetailsFetched && (
            <Button
              type="submit"
              variant="contained"
              disabled={
                !fields.userId ||
                !fields.roles ||
                (Array.isArray(fields.roles) && fields.roles.length === 0)
              }
            >
              {open.edit ? "Save" : "Add"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default CreateSupportUser;