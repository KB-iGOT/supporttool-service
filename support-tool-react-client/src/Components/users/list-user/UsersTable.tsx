import * as React from "react";
import { useState } from "react";
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
  Snackbar
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import LockResetIcon from "@mui/icons-material/LockReset";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { UserProfile } from "../../../types/users";
import { RoleAssignmentDialog } from "./RoleAssignmentDialog";
import { UserMigrationDialog } from "./UserMigrationDialog";
import { PasswordResetDialog } from "./PasswordResetDialog";
import { UserBlockDialog } from "./UserBlockDialog";
import { usersService } from "../../../services/users.service";
import { AppContext } from "../../../Context/AppContext";
import { appContextType } from "../../../types";
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
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<UserProfile | null>(null);

  const [roleChangesData, setRoleChangesData] = useState<any>(null);
  const [copySnackbar, setCopySnackbar] = useState({
    open: false,
    message: ''
  });

  const handleRoleClick = (user: UserProfile) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
    setAnchorEl(null);
  };

  const handleRoleDialogClose = () => {
    // setRoleDialogOpen(false);
    // setSelectedUser(null);
  };

  const handleMigrationClick = (user: UserProfile) => {
    setSelectedUser(user);
    setMigrationDialogOpen(true);
    setAnchorEl(null);
  };

  const handleMigrationDialogClose = () => {
    setMigrationDialogOpen(false);
    setSelectedUser(null);
  };

  const handlePasswordResetClick = (user: UserProfile) => {
    setSelectedUser(user);
    setPasswordResetDialogOpen(true);
    setAnchorEl(null);
  };

  const handlePasswordResetDialogClose = () => {
    setPasswordResetDialogOpen(false);
    setSelectedUser(null);
  };

  const handleBlockClick = (user: UserProfile) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
    setAnchorEl(null);
  };

  const handleBlockDialogClose = () => {
    setBlockDialogOpen(false);
    setSelectedUser(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserProfile) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleEditFromMenu = () => {
    if (menuUser) {
      onEditUser(menuUser);
      handleMenuClose();
    }
  };

  const handleRoleFromMenu = () => {
    if (menuUser) {
      handleRoleClick(menuUser);
      handleMenuClose();
    }
  };

  const handleDeleteFromMenu = () => {
    if (menuUser) {
      onDeleteUser(menuUser);
      handleMenuClose();
    }
  };

  const handleReissueCertificate = () => {
    if (menuUser && menuUser.identifier) {
      navigate(`/users/certificates?userId=${menuUser.identifier}`);
      handleMenuClose();
    }
  };

  const handleMigrationFromMenu = () => {
    if (menuUser) {
      handleMigrationClick(menuUser);
      handleMenuClose();
    }
  };

  const handlePasswordResetFromMenu = () => {
    if (menuUser) {
      handlePasswordResetClick(menuUser);
      handleMenuClose();
    }
  };

  const handleBlockFromMenu = () => {
    if (menuUser) {
      handleBlockClick(menuUser);
      handleMenuClose();
    }
  };


  // Create a ref to hold the latest form data
  const latestFormDataRef = React.useRef<any>({});

  const handleRoleAssignAction = async (userId: string, orgId: string, roles: string[], initialRoles: string[]): Promise<void> => {
    // Update both state and ref
    setRoleChangesData({ userId, orgId, roles, initialRoles });
    latestFormDataRef.current = { userId, orgId, roles, initialRoles };
    
    // Call handleEditSubmit which will use the latest data from the ref
      handleRoleChangesSubmit();
  }

  // Modify your useActionInterceptor to use the ref instead
  const { handleAction: handleRoleChangesSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleRoleAssign(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });
  

  const handleRoleAssign = async (data: any, userData: any) => {
    try {
      let changedFields = {
        "roles": {
          "new": userData?.roles,
           "original": userData?.initialRoles 
          }
        }
      
      let request = {
        payload: {
          request: {
            userId: userData?.userId,
            organisationId: userData?.orgId,
            roles: userData?.roles
          }
        },
        changedFields: changedFields|| {},
        module: moduleState?.name || 'users',
        jiraLink:data?.jiraLink || "",
    }
      await usersService.modifyUserRoles(request);

      setRoleDialogOpen(false);
      setSelectedUser(null);
      setTimeout(() => {
        if (onUserUpdated) {
          console.log("Roles updated, triggering data refresh");
          onUserUpdated();
        }
      }, 500);
    } catch (error) {
      console.error("Error assigning roles:", error);
      throw error;
    }
  };

  const handleUserMigrate = async (
    userId: string,
    data: {
      channel: string;
      forceMigration: boolean;
      softDeleteOldOrg: boolean;
      notifyMigration: boolean;
    }
  ) => {
    try {
      await usersService.migrateUser(userId, data);

      setTimeout(() => {
        if (onUserUpdated) {
          console.log("User migrated, triggering data refresh");

          onUserUpdated();
        }
      }, 1000);
    } catch (error) {
      console.error("Error migrating user:", error);
      throw error;
    }
  };


  // Create a ref to hold the latest form data
  const latestPasswordResetRef = React.useRef<{ userId: string; type: "email" }>({ userId: "", type: "email" });
  let passwordResetResolver: ((value: string) => void) | null = null;


  const handlePasswordResetAction = async (userId: string, notificationType: "email"): Promise<string> => {
    // Update both state and ref
    latestPasswordResetRef.current = { userId, type: notificationType };

    // Create a promise that will be resolved by handlePasswordReset
    const resetPromise = new Promise<string>((resolve) => {
        passwordResetResolver = resolve;
    });

    // Call handleEditSubmit which will use the latest data from the ref
    handleResetSubmit();
    
    return resetPromise;
};


  // Modify your useActionInterceptor to use the ref instead
  const { handleAction: handleResetSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete:  (interceptPayload) => handlePasswordReset(interceptPayload, latestPasswordResetRef.current),
    getPayload: () => ({})
  });


  const handlePasswordReset = async (ticket: any, data: any): Promise<void> => {
    console.log("Resetting password for user:", user, data);
    try {
      debugger
      let request = {
        payload: {
          request: {
            userId: data?.userId,
            key: "test", // Default key value as specified in the API
            type: data?.type
          }
        },
        jiraLink: ticket?.jiraLink || "",
        changedFields:'',
        module: moduleState?.name || 'users',
      }
        const response = await usersService.resetPassword(request);
        console.log("Password reset requested:", response);
        

        
        // Resolve the promise with the reset link
        if (passwordResetResolver) {
            passwordResetResolver(response.result.link);
            passwordResetResolver = null;
        }
    } catch (error) {
        console.error("Error resetting password:", error);
        if (passwordResetResolver) {
            passwordResetResolver(""); // or handle error appropriately
            passwordResetResolver = null;
        }
        throw error;
    }
};

  const handleUserBlock = async (userId: string, currentStatus: number, requestedById: string) => {
    try {
      if (currentStatus === 1) {
        await usersService.blockUser(userId, requestedById);
      } else {
        await usersService.unblockUser(userId, requestedById);
      }

      setTimeout(() => {
        if (onUserUpdated) {
          console.log("User block status updated, triggering data refresh");
          onUserUpdated();
        }
      }, 1000);
    } catch (error) {
      console.error("Error updating user block status:", error);
      throw error;
    }
  };

  // Updated function to handle copying email to clipboard with feedback
  const handleCopyEmail = (email: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering other click events
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopySnackbar({
          open: true,
          message: `Email ${email} copied to clipboard`
        });
      })
      .catch(err => {
        console.error('Failed to copy email: ', err);
        setCopySnackbar({
          open: true,
          message: 'Failed to copy email'
        });
      });
  };

  // Function to handle closing the snackbar
  const handleSnackbarClose = () => {
    setCopySnackbar({
      ...copySnackbar,
      open: false
    });
  };

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
                  <TableCell>Status</TableCell>
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

        {menuUser?.status !== 0 && permissions.canWrite && (
          <MenuItem onClick={handleReissueCertificate}>
            <ListItemIcon>
              <CardMembershipIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Re-issue Certificate</ListItemText>
          </MenuItem>
        )}

        {/* {menuUser?.status !== 0 && permissions.canDelete && (
          <MenuItem onClick={handleDeleteFromMenu}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItem>
        )} */}
      </Menu>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={copySnackbar.open}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message={copySnackbar.message}
      />

      <RoleAssignmentDialog
        open={roleDialogOpen}
        onClose={handleRoleDialogClose}
        user={selectedUser}
        onRoleAssign={handleRoleAssignAction}
      />

      <UserMigrationDialog
        open={migrationDialogOpen}
        onClose={handleMigrationDialogClose}
        user={selectedUser}
        onMigrate={handleUserMigrate}
      />

      <PasswordResetDialog
        open={passwordResetDialogOpen}
        onClose={handlePasswordResetDialogClose}
        user={selectedUser}
        onResetPassword={handlePasswordResetAction}
      />

      <UserBlockDialog
        open={blockDialogOpen}
        onClose={handleBlockDialogClose}
        user={selectedUser}
        onBlockUser={handleUserBlock}
        currentUserId={user?.userId || ""}
      />
    </Paper>
  );
};