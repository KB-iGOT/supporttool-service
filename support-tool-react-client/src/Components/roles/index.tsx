import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { rolesService } from '../../services/roles.service';
import { moduleService } from '../../services/modules.service';

// Interfaces for our data types
interface Role {
  id: number;
  name: string;
}

interface Module {
  id: number;
  name: string;
  description: string;
  path: string;
  isRootModule: boolean;
  isAdminModule: boolean;
  isContentModule: boolean;
  isVisible: boolean;
}

interface Permission {
  id: number;
  role_id: number;
  module_id: number;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

interface ModulePermission extends Module {
  permissions: {
    can_read: boolean;
    can_write: boolean;
    can_delete: boolean;
  };
}

export const Roles: React.FC = () => {
  // State for roles data
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  
  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  
  // Success/error message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
    fetchModules();
  }, []);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Fetch roles from API
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await rolesService.getRoles();
      setRoles(response.roles);
      setError(null);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch modules from API
  const fetchModules = async () => {
    try {
      const response = await moduleService.getModules();
      
      setModules(response);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };
  
  // Fetch permissions for a specific role
  const fetchPermissionsForRole = async (roleId: number) => {
    setLoading(true);
    try {
      const response = await rolesService.getRolePermissions(roleId);
      
      // Map permissions to modules
      const permissionsMap = new Map();
      response.permissions.forEach((permission: Permission) => {
        permissionsMap.set(permission.module_id, {
          can_read: permission.can_read,
          can_write: permission.can_write,
          can_delete: permission.can_delete
        });
      });
      
      // Create module permissions array
      const modulesWithPermissions = modules.map(module => {
        const permissions = permissionsMap.get(module.id) || {
          can_read: false,
          can_write: false,
          can_delete: false
        };
        
        return {
          ...module,
          permissions
        };
      });
      
      setModulePermissions(modulesWithPermissions);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to fetch permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle create role
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError('Role name cannot be empty!');
      return;
    }
    
    setLoading(true);
    try {
      await rolesService.createRole({ name: newRoleName.trim() }) 
      
      await fetchRoles();
      setOpenCreateDialog(false);
      setNewRoleName('');
      setSuccessMessage('Role created successfully!');
    } catch (err) {
      console.error('Error creating role:', err);
      setError('Failed to create role. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit role
  const handleEditRole = async () => {
    if (!currentRole || !currentRole.name.trim()) {
      setError('Role name cannot be empty!');
      return;
    }
    
    setLoading(true);
    try {
      await rolesService.updateRole(currentRole.id,{ name: currentRole.name.trim() });
      await fetchRoles();
      setOpenEditDialog(false);
      setSuccessMessage('Role updated successfully!');
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete role
  const handleDeleteRole = async () => {
    if (!currentRole) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/roles/${currentRole.id}`);
      await fetchRoles();
      setOpenDeleteDialog(false);
      setSuccessMessage('Role deleted successfully!');
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle save permissions
  const handleSavePermissions = async () => {
    if (!currentRole) return;
    
    setLoading(true);
    try {
      // Create permissions array to save
      const permissionsToSave = modulePermissions
        .filter(module => 
          module.permissions.can_read || 
          module.permissions.can_write || 
          module.permissions.can_delete
        )
        .map(module => ({
          role_id: currentRole.id,
          module_id: module.id,
          can_read: module.permissions.can_read,
          can_write: module.permissions.can_write,
          can_delete: module.permissions.can_delete
        }));
      
      await rolesService.updateRolePermissions(currentRole.id,{ permissions: permissionsToSave });
      setOpenPermissionsDialog(false);
      setSuccessMessage('Permissions updated successfully!');
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Failed to save permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle permission change
  const handlePermissionChange = (moduleId: number, permission: 'can_read' | 'can_write' | 'can_delete', value: boolean) => {
    setModulePermissions(prevPermissions => 
      prevPermissions.map(module => 
        module.id === moduleId ? 
          {
            ...module,
            permissions: {
              ...module.permissions,
              [permission]: value,
              // If turning off read, also turn off write and delete
              ...(permission === 'can_read' && !value ? 
                { can_write: false, can_delete: false } : 
                {}
              ),
              // If turning on write or delete, also turn on read
              ...(permission !== 'can_read' && value ? 
                { can_read: true } : 
                {}
              )
            }
          } : 
          module
      )
    );
  };
  
  // Open edit dialog
  const openEditDialogHandler = (role: Role) => {
    setCurrentRole(role);
    setOpenEditDialog(true);
  };
  
  // Open delete dialog
  const openDeleteDialogHandler = (role: Role) => {
    setCurrentRole(role);
    setOpenDeleteDialog(true);
  };
  
  // Open permissions dialog
  const openPermissionsDialogHandler = (role: Role) => {
    setCurrentRole(role);
    fetchPermissionsForRole(role.id);
    setOpenPermissionsDialog(true);
  };
  
  // Define module types for grouping
  const moduleTypes = [
    { key: 'rootModules', label: 'Regular Modules', filter: (m: Module) => m.isRootModule && !m.isAdminModule && !m.isContentModule },
    { key: 'adminModules', label: 'Admin Modules', filter: (m: Module) => m.isAdminModule },
    { key: 'contentModules', label: 'Content Modules', filter: (m: Module) => m.isContentModule },
    { key: 'otherModules', label: 'Other Modules', filter: (m: Module) => !m.isRootModule && !m.isAdminModule && !m.isContentModule }
  ];

  return (
    <Box sx={{ padding: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Role Management
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenCreateDialog(true)}
        >
          Create Role
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {loading && !openPermissionsDialog ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Role Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.length > 0 ? (
                  roles
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((role) => (
                      <TableRow key={role.id} hover>
                        <TableCell>{role.id}</TableCell>
                        <TableCell>{role.name}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Role">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => openEditDialogHandler(role)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage Permissions">
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => openPermissionsDialogHandler(role)}
                            >
                              <SecurityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Role">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => openDeleteDialogHandler(role)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No roles found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={roles.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </>
      )}
      
      {/* Create Role Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRole} 
            color="primary" 
            variant="contained"
            disabled={loading || !newRoleName.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Role Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentRole?.name || ''}
            onChange={(e) => setCurrentRole(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditRole} 
            color="primary" 
            variant="contained"
            disabled={loading || !currentRole?.name.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Role Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role <strong>"{currentRole?.name}"</strong>?
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            This action cannot be undone. All permissions associated with this role will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteRole} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Manage Permissions Dialog */}
      <Dialog 
        open={openPermissionsDialog} 
        onClose={() => setOpenPermissionsDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Manage Permissions for Role: {currentRole?.name}
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Read:</strong> Allows viewing the module content
                </Typography>
                <Typography variant="body2">
                  <strong>Write:</strong> Allows creating and editing content
                </Typography>
                <Typography variant="body2">
                  <strong>Delete:</strong> Allows deleting content
                </Typography>
              </Alert>
              
              {moduleTypes.map(moduleType => {
                const filteredModules = modulePermissions.filter(moduleType.filter);
                
                if (filteredModules.length === 0) {
                  return null;
                }
                
                return (
                  <Accordion key={moduleType.key} defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">{moduleType.label}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="center">Read</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="center">Write</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="center">Delete</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredModules.map(module => (
                              <TableRow key={module.id} hover>
                                <TableCell>{module.name}</TableCell>
                                <TableCell>{module.description || 'No description'}</TableCell>
                                <TableCell align="center">
                                  <Checkbox
                                    checked={module.permissions.can_read}
                                    onChange={(e) => handlePermissionChange(module.id, 'can_read', e.target.checked)}
                                    color="primary"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox
                                    checked={module.permissions.can_write}
                                    onChange={(e) => handlePermissionChange(module.id, 'can_write', e.target.checked)}
                                    color="primary"
                                    disabled={!module.permissions.can_read}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox
                                    checked={module.permissions.can_delete}
                                    onChange={(e) => handlePermissionChange(module.id, 'can_delete', e.target.checked)}
                                    color="primary"
                                    disabled={!module.permissions.can_read}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionsDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSavePermissions} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Permissions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};