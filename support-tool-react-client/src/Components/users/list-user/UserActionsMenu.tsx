import * as React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import LockResetIcon from "@mui/icons-material/LockReset";
import BlockIcon from "@mui/icons-material/Block";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { UserProfile } from '../../../types/users';

interface UserActionsMenuProps {
  anchorEl: null | HTMLElement;
  user: UserProfile | null;
  permissions: {
    canWrite: boolean;
    canDelete: boolean;
  };
  onClose: () => void;
  onEditUser: () => void;
  onDeleteUser: () => void;
  onEditPrimaryDetails: () => void;
  onManageRoles: () => void;
  onResetPassword: () => void;
  onMigrateUser: () => void;
  onBlockUser: () => void;
  onStatusUpdate: () => void;
  onViewDetails: () => void;
  onReissueCertificate: () => void;
}

export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  anchorEl,
  user,
  permissions,
  onClose,
  onEditUser,
  onDeleteUser,
  onEditPrimaryDetails,
  onManageRoles,
  onResetPassword,
  onMigrateUser,
  onBlockUser,
  onStatusUpdate,
  onViewDetails,
  onReissueCertificate,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right"
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right"
      }}
    >
      {user?.status !== 0 && permissions.canWrite && (
        <MenuItem onClick={onEditUser}>
          <ListItemIcon>
            <PencilIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User Details</ListItemText>
        </MenuItem>
      )}

      {user?.status !== 0 && permissions.canWrite && (
        <MenuItem onClick={onEditPrimaryDetails}>
          <ListItemIcon>
            <PencilIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Primary Details</ListItemText>
        </MenuItem>
      )}

      {user?.status !== 0 && permissions.canWrite && (
        <MenuItem onClick={onManageRoles}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage User Roles</ListItemText>
        </MenuItem>
      )}

      {user?.status !== 0 && permissions.canWrite && (
        <MenuItem onClick={onResetPassword}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
      )}

      {user?.status !== 0 && permissions.canWrite && (
        <MenuItem onClick={onMigrateUser}>
          <ListItemIcon>
            <CompareArrowsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Migrate User</ListItemText>
        </MenuItem>
      )}

      {permissions.canWrite && (
        <MenuItem onClick={onBlockUser}>
          <ListItemIcon>
            {user?.status === 1 ? (
              <BlockIcon fontSize="small" />
            ) : (
              <LockOpenIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {user?.status === 1
              ? "Block User"
              : "Unblock User"}
          </ListItemText>
        </MenuItem>
      )}

      {permissions.canWrite && user?.profileDetails?.profileStatus === 'NOT-MY-USER' && (
        <MenuItem onClick={onStatusUpdate}>
          <ListItemIcon>
            <AssignmentTurnedInIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reassign User</ListItemText>
        </MenuItem>
      )}

      {permissions.canWrite && (
        <MenuItem onClick={onViewDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Full Details</ListItemText>
        </MenuItem>
      )}

      {user?.status !== 0 && permissions.canWrite && (
        <MenuItem onClick={onReissueCertificate}>
          <ListItemIcon>
            <CardMembershipIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Re-issue Certificate</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};

export {};