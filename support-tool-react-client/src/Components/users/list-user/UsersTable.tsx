import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Alert,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import LockResetIcon from "@mui/icons-material/LockReset";
import BlockIcon from "@mui/icons-material/Block";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { UserProfile } from "../../../types/users";
import { JsonViewerDialog } from "../../common-components/JsonViewerDialog";
import { RoleAssignmentDialog } from "./RoleAssignmentDialog";
import { UserMigrationDialog } from "./UserMigrationDialog";
import { PasswordResetDialog } from "./PasswordResetDialog";
import { UserStatusUpdateDialog } from "./UserStatusUpdateDialog";
import { UserBlockDialog } from "./UserBlockDialog";
import { usersService } from "../../../services/users.service";
import { AppContext } from "../../../Context/AppContext";
import { appContextType } from "../../../types";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useActionInterceptor } from "../../../hooks/useActionInterceptor";

interface UsersTableProps {
  users: UserProfile[];
  usersCount: number;
  page: number;
  rowsPerPage: number;
  loading: boolean;
  searchType: string;
  permissions: {
    canWrite: boolean;
    canDelete: boolean;
  };
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (user: UserProfile) => void;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUserUpdated?: () => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  usersCount,
  page,
  rowsPerPage,
  loading,
  permissions,
  searchType,
  onEditUser,
  onDeleteUser,
  onPageChange,
  onRowsPerPageChange,
  onUserUpdated
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const moduleState = location.state;
  const { user } = React.useContext(AppContext) as appContextType;

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<UserProfile | null>(null);

  // Notification states
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Refs for action interceptors
  const latestFormDataRef = useRef<any>({});
  const latestPasswordResetRef = useRef<{ userId: string; type: "email"; selectedUser?: UserProfile | null }>({ userId: "", type: "email" });
  const passwordResetResolver = useRef<((value: string) => void) | null>(null);

  // Helper functions
  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  const closeNotification = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const closeDialog = useCallback((dialogType: 'role' | 'migration' | 'password' | 'block' | 'view' | 'statusUpdate') => {
    switch (dialogType) {
      case 'role':
        setRoleDialogOpen(false);
        break;
      case 'migration':
        setMigrationDialogOpen(false);
        break;
      case 'password':
        setPasswordResetDialogOpen(false);
        break;
      case 'block':
        setBlockDialogOpen(false);
        break;
      case 'statusUpdate':
        setStatusUpdateDialogOpen(false);
        break;
      case 'view':
        setViewDetailsDialogOpen(false);
        break;
    }
    setSelectedUser(null);
  }, []);

  const refreshData = useCallback(() => {
    if (onUserUpdated) {
      onUserUpdated();
    }
  }, [onUserUpdated]);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserProfile) => { 
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  // Dialog open handlers
  const openDialog = useCallback((dialogType: 'role' | 'migration' | 'password' | 'block' | 'view' | 'statusUpdate', user: UserProfile) => {
    setSelectedUser(user);
    switch (dialogType) {
      case 'role':
        setRoleDialogOpen(true);
        break;
      case 'migration':
        setMigrationDialogOpen(true);
        break;
      case 'password':
        setPasswordResetDialogOpen(true);
        break;
      case 'block':
        setBlockDialogOpen(true);
        break;
      case 'statusUpdate':
        setStatusUpdateDialogOpen(true);
        break;
      case 'view':
        setViewDetailsDialogOpen(true);
        break;
    }
    setAnchorEl(null);
  }, []);

  // Menu action handlers
  const handleEditFromMenu = () => {
    if (menuUser) {
      onEditUser(menuUser);
      handleMenuClose();
    }
  };

  const handleRoleFromMenu = () => {
    if (menuUser) {
      openDialog('role', menuUser);
    }
  };

  const handleDeleteFromMenu = () => {
    if (menuUser) {
      onDeleteUser(menuUser);
      handleMenuClose();
    }
  };

  const handleReissueCertificate = () => {
    if (menuUser?.identifier) {
      navigate(`/users/certificates?userId=${menuUser.identifier}`);
      handleMenuClose();
    }
  };

  const handleMigrationFromMenu = () => {
    if (menuUser) {
      openDialog('migration', menuUser);
    }
  };

  const handlePasswordResetFromMenu = () => {
    if (menuUser) {
      openDialog('password', menuUser);
    }
  };

  const handleBlockFromMenu = () => {
    if (menuUser) {
      openDialog('block', menuUser);
    }
  };

  const handleStatusUpdateFromMenu = () => {
    if (menuUser) {
      openDialog('statusUpdate', menuUser);
    }
  };

  const handleViewDetailsFromMenu = () => {
    if (menuUser) {
      openDialog('view', menuUser);
    }
  };

  // Copy email functionality
  const handleCopyEmail = useCallback((email: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(email)
      .then(() => {
        showNotification(`Email ${email} copied to clipboard`, 'success');
      })
      .catch(err => {
        console.error('Failed to copy email: ', err);
        showNotification('Failed to copy email', 'error');
      });
  }, [showNotification]);

  // Role assignment functionality
  const handleRoleAssignAction = useCallback(async (userId: string, orgId: string, roles: string[], initialRoles: string[]): Promise<void> => {
    latestFormDataRef.current = { 
      userId, 
      orgId, 
      roles, 
      initialRoles,
      selectedUser: selectedUser // Include the selected user for reference
    };
    handleRoleChangesSubmit();
  }, [selectedUser]);

  const { handleAction: handleRoleChangesSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleRoleAssign(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  const handleRoleAssign = useCallback(async (data: any, userData: any) => {
    try {
      const changedFields = {
        "roles": {
          "new": userData?.roles,
          "original": userData?.initialRoles 
        }
      };
      
      const request = {
        payload: {
          request: {
            userId: userData?.userId,
            organisationId: userData?.orgId,
            roles: userData?.roles
          }
        },
        changedFields,
        module: moduleState?.name || 'users',
        jiraLink: data?.jiraLink || "",
            userId: userData?.userId,
      };

      await usersService.modifyUserRoles(request);
      closeDialog('role');
      showNotification('User roles updated successfully', 'success');
      refreshData();
    } catch (error) {
      console.error("Error assigning roles:", error);
      showNotification('Failed to update user roles', 'error');
      throw error;
    }
  }, [moduleState?.name, closeDialog, showNotification, refreshData]);

  // User migration functionality
  const handleUserMigrateAction = useCallback(async (userId: string, data: any): Promise<void> => {
    // Store both the user data and the migration data
    latestFormDataRef.current = { 
      userId, 
      ...data,
      selectedUser: selectedUser // Include the selected user for reference
    };
    handleMigrationChangesSubmit();
  }, [selectedUser]);

  const { handleAction: handleMigrationChangesSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleUserMigrate(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  const handleUserMigrate = useCallback(async (ticket: any, data: any) => {
    try {
      const changedFields = {
        "roles": {
          "new": data.channel,
          "original":  data?.selectedUser?.channel
        }
      };
      
      const request = {
        payload: {
          request: {
            userId: data.userId,
            channel: data.channel,
            forceMigration: data.forceMigration,
            softDeleteOldOrg: data.softDeleteOldOrg,
            notifyMigration: data.notifyMigration
          }
        },
        jiraLink: ticket?.jiraLink || "",
        changedFields,
        userId: data.userId,
        module: moduleState?.name || 'users',
      };

      await usersService.migrateUser(request);
      showNotification('User migrated successfully', 'success');
      closeDialog('migration');
      refreshData();
    } catch (error) {
      console.error("Error migrating user:", error);
      showNotification('Failed to migrate user', 'error');
      throw error;
    }
  }, [moduleState?.name, showNotification, closeDialog, refreshData]);

  // Password reset functionality
  const handlePasswordResetAction = useCallback(async (userId: string, notificationType: "email"): Promise<string> => {
    latestPasswordResetRef.current = { 
      userId, 
      type: notificationType,
      selectedUser: selectedUser // Include the selected user for reference
    };

    const resetPromise = new Promise<string>((resolve) => {
      passwordResetResolver.current = resolve;
    });

    handleResetSubmit();
    return resetPromise;
  }, [selectedUser]);

  const { handleAction: handleResetSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handlePasswordReset(interceptPayload, latestPasswordResetRef.current),
    getPayload: () => ({})
  });

  const handlePasswordReset = useCallback(async (ticket: any, data: any): Promise<void> => {
    try {
      const request = {
        payload: {
          request: {
            userId: data?.userId,
            key: "test",
            type: data?.type
          }
        },
        jiraLink: ticket?.jiraLink || "",
        changedFields: '',
        userId: data?.userId,
        module: moduleState?.name || 'users',
      };

      const response = await usersService.resetPassword(request);
      
      if (passwordResetResolver.current) {
        passwordResetResolver.current(response.result.link);
        passwordResetResolver.current = null;
      }
      
      showNotification('Password reset link generated successfully', 'success');
    } catch (error) {
      console.error("Error resetting password:", error);
      if (passwordResetResolver.current) {
        passwordResetResolver.current("");
        passwordResetResolver.current = null;
      }
      showNotification('Failed to reset password', 'error');
      throw error;
    }
  }, [moduleState?.name, showNotification]);

  // User Block/Unblock functionality
  const handleUserBlockUnblockAction = useCallback(async (userId: string, currentStatus: number, requestedById: string): Promise<void> => {
    // Store both the user data and the migration data
    latestFormDataRef.current = { 
      userId, 
      currentStatus,
      requestedById,
      selectedUser: selectedUser // Include the selected user for reference
    };
    handleUserBlockUnblockSubmit();
  }, [selectedUser]);

  const { handleAction: handleUserBlockUnblockSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleUserBlock(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });


  // User block functionality
  const handleUserBlock = useCallback(async (ticket: any, data: any) => {
    try {

      let request = {
        payload: {
          request: {
            userId: data.userId,
            requestedBy: data.requestedById
          }
        },
        jiraLink: ticket?.jiraLink || "",
        changedFields: {'status:': {'new': data.currentStatus === 1 ? 0 : 1, 'original': data.currentStatus}},
        module: moduleState?.name || 'users',
        userId: data.userId
      }
      if (data?.currentStatus === 1) {
        await usersService.blockUser(request);
        showNotification('User blocked successfully', 'success');
      } else {
        await usersService.unblockUser(request);
        showNotification('User unblocked successfully', 'success');
      }
      closeDialog('block');
      refreshData();
    } catch (error) {
      console.error("Error updating user block status:", error);
      showNotification('Failed to update user block status', 'error');
      throw error;
    }
  }, [showNotification, refreshData, selectedUser]);

  // User Status Update functionality
  const handleUserStatusUpdateAction = useCallback(async (userId: string, newStatus: 'NOT-MY-USER' | 'NOT-VERIFIED'): Promise<void> => {
    latestFormDataRef.current = {
      userId,
      newStatus,
      selectedUser: selectedUser
    };
    handleUserStatusUpdateSubmit();
  }, [selectedUser]);

  const { handleAction: handleUserStatusUpdateSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleUserStatusUpdate(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  const handleUserStatusUpdate = useCallback(async (ticket: any, data: any) => {
    try {
      const request = {
        payload: {
          request: {
            userId: data.userId,
            profileDetails: {
              profileStatus: data.newStatus
            }
          }
        },
        jiraLink: ticket?.jiraLink || "",
        changedFields: { 'profileStatus': { 'new': data.newStatus, 'original': data.selectedUser?.profileDetails?.profileStatus } },
        module: moduleState?.name || 'users',
        userId: data.userId
      };
      await usersService.updateUserExt(request);
      showNotification('User status updated successfully', 'success');
      refreshData();
    } catch (error) {
      console.error("Error updating user status:", error);
      showNotification('Failed to update user status', 'error');
      throw error;
    }
  }, [moduleState?.name, showNotification, refreshData]);

  return (
    <Paper elevation={2}>
      {users && users.length > 0 ? (
        <>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="users table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>User Status</TableCell>
                  <TableCell>Profile Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((row) => (
                  <TableRow
                    key={row.identifier}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.firstName} {row.lastName || ""}
                    </TableCell>
                    <TableCell>{row.rootOrgName || "-"}</TableCell>
                    <TableCell>
                      {row?.profileDetails?.personalDetails?.primaryEmail ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{row.profileDetails.personalDetails.primaryEmail}</span>
                          {searchType === 'roles' && (
                            <Tooltip title="Copy email">
                              <IconButton
                                size="small"
                                onClick={(e) => handleCopyEmail(row.profileDetails.personalDetails.primaryEmail, e)}
                                sx={{ padding: 0.5 }}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {row?.profileDetails?.personalDetails?.mobile || "-"}
                    </TableCell>
                    <TableCell><Chip 
                        label={row?.status === 1 ? "Active" : "Inactive"}
                        color={row?.status === 1 ? "success" : "error"}
                        size="small"
                        sx={{ mr: { xs: 0, sm: 1 } }}
                      />
                </TableCell>
                    <TableCell>{row?.profileDetails?.profileStatus || "-"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="User Actions">
                        <IconButton
                          aria-label="actions"
                          size="small"
                          onClick={(event) => handleMenuOpen(event, row)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={usersCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </>
      ) : (
        <Alert severity="info" sx={{ m: 2 }}>
          {loading
            ? "Loading users..."
            : "No users available. Try different search parameters."}
        </Alert>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
      >
        {menuUser?.status !== 0 && permissions.canWrite && (
          <MenuItem onClick={handleEditFromMenu}>
            <ListItemIcon>
              <PencilIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit User Details</ListItemText>
          </MenuItem>
        )}

        {menuUser?.status !== 0 && permissions.canWrite && (
          <MenuItem onClick={handleRoleFromMenu}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage User Roles</ListItemText>
          </MenuItem>
        )}

        {menuUser?.status !== 0 && permissions.canWrite && (
          <MenuItem onClick={handlePasswordResetFromMenu}>
            <ListItemIcon>
              <LockResetIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset Password</ListItemText>
          </MenuItem>
        )}

        {menuUser?.status !== 0 && permissions.canWrite && (
          <MenuItem onClick={handleMigrationFromMenu}>
            <ListItemIcon>
              <CompareArrowsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Migrate User</ListItemText>
          </MenuItem>
        )}

        {permissions.canWrite && (
          <MenuItem onClick={handleBlockFromMenu}>
            <ListItemIcon>
              {menuUser?.status === 1 ? (
                <BlockIcon fontSize="small" />
              ) : (
                <LockOpenIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>
              {menuUser?.status === 1
                ? "Block User"
                : "Unblock User"}
            </ListItemText>
          </MenuItem>
        )}

        {permissions.canWrite && menuUser?.profileDetails?.profileStatus === 'NOT-VERIFIED' && (
          <MenuItem onClick={handleStatusUpdateFromMenu}>
            <ListItemIcon>
              <ReportProblemIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Not My User</ListItemText>
          </MenuItem>
        )}

        {permissions.canWrite && menuUser?.profileDetails?.profileStatus === 'NOT-MY-USER' && (
          <MenuItem onClick={handleStatusUpdateFromMenu}>
            <ListItemIcon>
              <AssignmentTurnedInIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reassign User</ListItemText>
          </MenuItem>
        )}

        {permissions.canWrite && (
          <MenuItem onClick={handleViewDetailsFromMenu}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Full Details</ListItemText>
          </MenuItem>
        )}

        {menuUser?.status !== 0 && permissions.canWrite && (
          <MenuItem onClick={handleReissueCertificate}>
            <ListItemIcon>
              <CardMembershipIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Re-issue Certificate</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Notification Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeNotification}
        message={snackbar.message}
      />

      {/* Dialogs */}
      <RoleAssignmentDialog
        open={roleDialogOpen}
        onClose={() => closeDialog('role')}
        user={selectedUser}
        onRoleAssign={handleRoleAssignAction}
      />

      <UserMigrationDialog
        open={migrationDialogOpen}
        onClose={() => closeDialog('migration')}
        user={selectedUser}
        onMigrate={handleUserMigrateAction}
      />

      <PasswordResetDialog
        open={passwordResetDialogOpen}
        onClose={() => closeDialog('password')}
        user={selectedUser}
        onResetPassword={handlePasswordResetAction}
      />

      <UserBlockDialog
        open={blockDialogOpen}
        onClose={() => closeDialog('block')}
        user={selectedUser}
        onBlockUser={handleUserBlockUnblockAction}
        currentUserId={user?.userId || ""}
      />

      <UserStatusUpdateDialog
        open={statusUpdateDialogOpen}
        onClose={() => closeDialog('statusUpdate')}
        user={selectedUser}
        onConfirm={handleUserStatusUpdateAction}
      />

      <JsonViewerDialog
        open={viewDetailsDialogOpen}
        onClose={() => closeDialog('view')}
        title={`User Details: ${selectedUser?.firstName || ''}`}
        data={selectedUser}
      />
    </Paper>
  );
};