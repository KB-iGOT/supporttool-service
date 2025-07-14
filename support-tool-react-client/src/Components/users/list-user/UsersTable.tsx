import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import for navigation
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
import CardMembershipIcon from "@mui/icons-material/CardMembership"; // Import for certificate icon
import { UserProfile } from "../../../types/users";
import { RoleAssignmentDialog } from "./RoleAssignmentDialog";
import { usersService } from "../../../services/users.service";

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
  const navigate = useNavigate(); // Initialize navigation hook
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<UserProfile | null>(null);
  
  const handleRoleClick = (user: UserProfile) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
    setAnchorEl(null); // Close menu if open
  };

  const handleRoleDialogClose = () => {
    setRoleDialogOpen(false);
    setSelectedUser(null);
  };
  
  // Menu handlers
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
  
  // New handler for re-issue certificate
  const handleReissueCertificate = () => {
    if (menuUser && menuUser.identifier) {
      // Navigate to the certificate page with userId as query parameter
      navigate(`/users/certificates?userId=${menuUser.identifier}`);
      handleMenuClose();
    }
  };

  const handleRoleAssign = async (userId: string, orgId: string, roles: string[]) => {
    try {
      await usersService.assignUserRoles(userId, orgId, roles);
      
      // Add a small delay before triggering refresh to ensure server has processed the update
      setTimeout(() => {
        if (onUserUpdated) {
          console.log('Roles updated, triggering data refresh');
          onUserUpdated();
        }
      }, 500);
      
    } catch (error) {
      console.error('Error assigning roles:', error);
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
                      {row.firstName} {row.lastName || ''}
                    </TableCell>
                    <TableCell>{row.rootOrgName || '-'}</TableCell>
                    <TableCell>{row?.profileDetails?.personalDetails?.primaryEmail || '-'}</TableCell>
                    <TableCell>{row?.profileDetails?.personalDetails?.mobile || '-'}</TableCell>
                    <TableCell>{row?.profileDetails?.profileStatus || '-'}</TableCell>
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
      
      {/* Actions Menu - Updated with Certificate option */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
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
      
      {/* Role Assignment Dialog */}
      <RoleAssignmentDialog
        open={roleDialogOpen}
        onClose={handleRoleDialogClose}
        user={selectedUser}
        onRoleAssign={handleRoleAssign}
      />
    </Paper>
  );
};