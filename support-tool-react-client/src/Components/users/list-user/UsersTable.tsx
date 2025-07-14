import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ListItemText
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
import { UserProfile } from "../../../types/users";
import { RoleAssignmentDialog } from "./RoleAssignmentDialog";
import { UserMigrationDialog } from "./UserMigrationDialog";
import { PasswordResetDialog } from "./PasswordResetDialog";
import { UserBlockDialog } from "./UserBlockDialog";
import { usersService } from "../../../services/users.service";
import { AppContext } from "../../../Context/AppContext";
import { appContextType } from "../../../types";

interface UsersTableProps {
  users: UserProfile[];
  usersCount: number;
  page: number;
  rowsPerPage: number;
  loading: boolean;
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
  onEditUser,
  onDeleteUser,
  onPageChange,
  onRowsPerPageChange,
  onUserUpdated
}) => {
  const navigate = useNavigate();
    const { user } = React.useContext(AppContext) as appContextType;
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<UserProfile | null>(null);

  const handleRoleClick = (user: UserProfile) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
    setAnchorEl(null);
  };

  const handleRoleDialogClose = () => {
    setRoleDialogOpen(false);
    setSelectedUser(null);
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

  const handleRoleAssign = async (userId: string, orgId: string, roles: string[]) => {
    try {
      await usersService.assignUserRoles(userId, orgId, roles);

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

  const handlePasswordReset = async (userId: string, type: "email") => {
    try {
      const response = await usersService.resetPassword(userId, type);
      console.log("Password reset requested:", response);
      return response.result.link;
    } catch (error) {
      console.error("Error resetting password:", error);
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
                      {row?.profileDetails?.personalDetails?.primaryEmail || "-"}
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
        {permissions.canWrite && (
          <MenuItem onClick={handleEditFromMenu}>
            <ListItemIcon>
              <PencilIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit User Details</ListItemText>
          </MenuItem>
        )}

        {permissions.canWrite && (
          <MenuItem onClick={handleRoleFromMenu}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage User Roles</ListItemText>
          </MenuItem>
        )}

        {permissions.canWrite && (
          <MenuItem onClick={handlePasswordResetFromMenu}>
            <ListItemIcon>
              <LockResetIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset Password</ListItemText>
          </MenuItem>
        )}

        {permissions.canWrite && (
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

        {permissions.canWrite && (
          <MenuItem onClick={handleReissueCertificate}>
            <ListItemIcon>
              <CardMembershipIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Re-issue Certificate</ListItemText>
          </MenuItem>
        )}

        {permissions.canDelete && (
          <MenuItem onClick={handleDeleteFromMenu}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <RoleAssignmentDialog
        open={roleDialogOpen}
        onClose={handleRoleDialogClose}
        user={selectedUser}
        onRoleAssign={handleRoleAssign}
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
        onResetPassword={handlePasswordReset}
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