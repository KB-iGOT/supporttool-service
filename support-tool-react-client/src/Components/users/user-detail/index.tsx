import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, Paper, Button, Alert, Snackbar, AlertColor,
  LinearProgress, Chip, Card, CardContent, Divider, IconButton, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RefreshIcon from '@mui/icons-material/Refresh';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { UserProfile } from '../../../types/users';
import { usersService } from '../../../services/users.service';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';

// Dialogs
import { RoleAssignmentDialog } from '../list-user/RoleAssignmentDialog';
import { UserMigrationDialog } from '../list-user/UserMigrationDialog';
import { PasswordResetDialog } from '../list-user/PasswordResetDialog';
import { UserBlockDialog } from '../list-user/UserBlockDialog';
import { UserStatusUpdateDialog } from '../list-user/UserStatusUpdateDialog';
import { JsonViewerDialog } from '../../common-components/JsonViewerDialog';

// Embedded sub-pages
import { ReissueCertificate } from '../re-issue-certificate';
import { CBPlanPage } from '../cbp-plan';
import { AssignedCAPPage } from '../assigned-cap';

// Summary card & edit tab
import { UserSummaryCard } from './UserSummaryCard';
import { EditProfileTab } from  './EditProfileTab';
import { ContentAccessTab } from './ContentAccessTab';

// -------------------- Constants --------------------

const TAB_KEYS = ['overview', 'edit-profile', 'roles', 'password', 'migration', 'block', 'certificates', 'cbp', 'cap', 'content-access'] as const;

// -------------------- TabPanel --------------------

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`user-tabpanel-${index}`}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// -------------------- Action Card --------------------

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonLabel: string;
  onAction: () => void;
  disabled?: boolean;
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'error' | 'warning' | 'success';
  children?: React.ReactNode;
}

function ActionCard({ title, description, icon, buttonLabel, onAction, disabled, variant = 'contained', color = 'primary', children }: ActionCardProps) {
  return (
    <Card variant="outlined" sx={{ maxWidth: 600 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          {icon}
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {description}
        </Typography>
        {children}
        <Divider sx={{ my: 2 }} />
        <Button
          variant={variant}
          color={color}
          onClick={onAction}
          disabled={disabled}
          size="large"
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

// -------------------- UserDetailPage --------------------

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleState = location.state;

  // Tab state
  const tabParam = searchParams.get('tab') || 'overview';
  const activeTab = Math.max(0, TAB_KEYS.indexOf(tabParam as typeof TAB_KEYS[number]));

  // User data
  const [userData, setUserData] = useState<UserProfile | null>(
    moduleState?.user || null
  );
  const [loading, setLoading] = useState(!moduleState?.user);
  const [error, setError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; open: boolean; severity: AlertColor }>({
    message: '', open: false, severity: 'info'
  });

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [viewJsonDialogOpen, setViewJsonDialogOpen] = useState(false);

  // Context
  const { checkPermissions, user: currentUser } = React.useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

  // Refs for action interceptors
  const latestFormDataRef = useRef<any>({});
  const latestPasswordResetRef = useRef<any>({ userId: '', type: 'email' });
  const passwordResetResolver = useRef<((value: string) => void) | null>(null);

  // -------------------- Fetch User --------------------

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const requestPayload = {
        request: {
          fields: [],
          facets: [],
          limit: 1,
          filters: { userId: [userId] },
          offset: 0,
        },
        query: ''
      };
      const data = await usersService.getUsers(requestPayload);
      const user = data.result?.response?.content?.[0] || null;
      if (user) {
        setUserData(user);
        setError(null);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!moduleState?.user) {
      fetchUser();
    }
  }, [fetchUser, moduleState?.user]);

  // -------------------- Helpers --------------------

  const showToast = (message: string, severity: AlertColor) => {
    setToast({ message, open: true, severity });
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSearchParams({ tab: TAB_KEYS[newValue] });
  };

  const handleBack = () => {
    if (moduleState?.searchContext) {
      navigate('/users', { state: moduleState.searchContext });
    } else {
      navigate('/users');
    }
  };

  // -------------------- Role Assignment --------------------

  const handleRoleAssignAction = useCallback(async (userId: string, orgId: string, roles: string[], initialRoles: string[]) => {
    latestFormDataRef.current = { userId, orgId, roles, initialRoles, selectedUser: userData };
    handleRoleChangesInterceptor();
  }, [userData]);

  const { handleAction: handleRoleChangesInterceptor } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleRoleAssign(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  const handleRoleAssign = useCallback(async (data: any, formData: any) => {
    try {
      const request = {
        payload: {
          request: {
            userId: formData?.userId,
            organisationId: formData?.orgId,
            roles: formData?.roles
          }
        },
        changedFields: { roles: { new: formData?.roles, original: formData?.initialRoles } },
        module: moduleState?.name || 'users',
        jiraLink: data?.jiraLink || '',
        userId: formData?.userId,
      };
      await usersService.modifyUserRoles(request);
      setRoleDialogOpen(false);
      showToast('User roles updated successfully', 'success');
      fetchUser();
    } catch (error) {
      console.error('Error assigning roles:', error);
      showToast('Failed to update user roles', 'error');
    }
  }, [moduleState?.name]);

  // -------------------- User Migration --------------------

  const handleUserMigrateAction = useCallback(async (userId: string, data: any) => {
    latestFormDataRef.current = { userId, ...data, selectedUser: userData };
    handleMigrationInterceptor();
  }, [userData]);

  const { handleAction: handleMigrationInterceptor } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleUserMigrate(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  const handleUserMigrate = useCallback(async (ticket: any, data: any) => {
    try {
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
        jiraLink: ticket?.jiraLink || '',
        changedFields: { roles: { new: data.channel, original: data?.selectedUser?.channel } },
        userId: data.userId,
        module: moduleState?.name || 'users',
      };
      await usersService.migrateUser(request);
      showToast('User migrated successfully', 'success');
      setMigrationDialogOpen(false);
      fetchUser();
    } catch (error) {
      console.error('Error migrating user:', error);
      showToast('Failed to migrate user', 'error');
    }
  }, [moduleState?.name]);

  // -------------------- Password Reset --------------------

  const handlePasswordResetAction = useCallback(async (userId: string, notificationType: 'email', setLoading?: (v: boolean) => void): Promise<string> => {
    latestPasswordResetRef.current = { userId, type: notificationType, selectedUser: userData, setLoading };
    const resetPromise = new Promise<string>((resolve) => {
      passwordResetResolver.current = resolve;
    });
    handleResetInterceptor();
    return resetPromise;
  }, [userData]);

  const { handleAction: handleResetInterceptor } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handlePasswordReset(interceptPayload, latestPasswordResetRef.current),
    getPayload: () => ({})
  });

  const handlePasswordReset = useCallback(async (ticket: any, data: any) => {
    try {
      data?.setLoading?.(true);
      const request = {
        payload: {
          request: { userId: data?.userId, key: 'test', type: data?.type }
        },
        jiraLink: ticket?.jiraLink || '',
        changedFields: '',
        userId: data?.userId,
        module: moduleState?.name || 'users',
      };
      const response = await usersService.resetPassword(request);
      if (passwordResetResolver.current) {
        passwordResetResolver.current(response.result.link);
        passwordResetResolver.current = null;
      }
      showToast('Password reset link generated successfully', 'success');
    } catch (error) {
      console.error('Error resetting password:', error);
      if (passwordResetResolver.current) {
        passwordResetResolver.current('');
        passwordResetResolver.current = null;
      }
      showToast('Failed to reset password', 'error');
    }
  }, [moduleState?.name]);

  // -------------------- Block/Unblock --------------------

  const handleUserBlockUnblockAction = useCallback(async (userId: string, currentStatus: number, requestedById: string) => {
    latestFormDataRef.current = { userId, currentStatus, requestedById, selectedUser: userData };
    handleBlockInterceptor();
  }, [userData]);

  const { handleAction: handleBlockInterceptor } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleUserBlock(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  const handleUserBlock = useCallback(async (ticket: any, data: any) => {
    try {
      const request = {
        payload: {
          request: { userId: data.userId, requestedBy: data.requestedById }
        },
        jiraLink: ticket?.jiraLink || '',
        changedFields: { 'status': { new: data.currentStatus === 1 ? 0 : 1, original: data.currentStatus } },
        module: moduleState?.name || 'users',
        userId: data.userId
      };
      if (data?.currentStatus === 1) {
        await usersService.blockUser(request);
        showToast('User blocked successfully', 'success');
      } else {
        await usersService.unblockUser(request);
        showToast('User unblocked successfully', 'success');
      }
      setBlockDialogOpen(false);
      fetchUser();
    } catch (error) {
      console.error('Error updating user block status:', error);
      showToast('Failed to update user block status', 'error');
    }
  }, [moduleState?.name]);

  // -------------------- Status Update (Reassign) --------------------

  const handleUserStatusUpdateAction = useCallback(async (userId: string, newStatus: 'NOT-MY-USER' | 'NOT-VERIFIED') => {
    latestFormDataRef.current = { userId, newStatus, selectedUser: userData };
    handleStatusUpdateInterceptor();
  }, [userData]);

  const { handleAction: handleStatusUpdateInterceptor } = useActionInterceptor({
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
            profileDetails: { profileStatus: data.newStatus }
          }
        },
        jiraLink: ticket?.jiraLink || '',
        changedFields: { profileStatus: { new: data.newStatus, original: data.selectedUser?.profileDetails?.profileStatus } },
        module: moduleState?.name || 'users',
        userId: data.userId
      };
      await usersService.updateUserExt(request);
      showToast('User status updated successfully', 'success');
      setStatusUpdateDialogOpen(false);
      fetchUser();
    } catch (error) {
      console.error('Error updating user status:', error);
      showToast('Failed to update user status', 'error');
    }
  }, [moduleState?.name]);

  // -------------------- Derived Values --------------------

  const isActive = userData?.status === 1;
  const isBlocked = userData?.status === 0;
  const isNotMyUser = userData?.profileDetails?.profileStatus === 'NOT-MY-USER';
  const canWrite = permissions.canWrite;
  const userEmail = userData?.profileDetails?.personalDetails?.primaryEmail || '';
  const userName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim();
  const rootOrgId = userData?.rootOrgId || '';

  // -------------------- Render --------------------

  if (loading && !userData) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading user details...</Typography>
      </Box>
    );
  }

  if (error && !userData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Users
        </Button>
      </Box>
    );
  }

  if (!userData) return null;

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Back to Users">
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">User Details</Typography>
        </Box>
        <Tooltip title="Refresh user data">
          <IconButton onClick={fetchUser} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* User Summary Card */}
      <UserSummaryCard user={userData} />

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', minHeight: 48, fontWeight: 500 }
          }}
        >
          <Tab icon={<VisibilityIcon />} iconPosition="start" label="Overview" />
          <Tab icon={<EditIcon />} iconPosition="start" label="Edit Profile" disabled={isBlocked} />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Roles" disabled={isBlocked} />
          <Tab icon={<LockResetIcon />} iconPosition="start" label="Password" disabled={isBlocked} />
          <Tab icon={<CompareArrowsIcon />} iconPosition="start" label="Migration" disabled={isBlocked} />
          <Tab icon={isActive ? <BlockIcon /> : <LockOpenIcon />} iconPosition="start" label={isActive ? 'Block' : 'Unblock'} />
          <Tab icon={<CardMembershipIcon />} iconPosition="start" label="Certificates" disabled={isBlocked} />
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="CBP Plan" />
          <Tab icon={<SchoolIcon />} iconPosition="start" label="Assigned CAP" />
          <Tab icon={<ManageSearchIcon />} iconPosition="start" label="Content Access" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}

      {/* Overview */}
      <TabPanel value={activeTab} index={0}>
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>  
              <Typography variant="h6">User Profile Overview</Typography>
              <Box display="flex" gap={1}>
                <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setViewJsonDialogOpen(true)}>
                  View Raw JSON
                </Button>
                {isNotMyUser && canWrite && (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<AssignmentTurnedInIcon />}
                    onClick={() => setStatusUpdateDialogOpen(true)}
                  >
                    Reassign User
                  </Button>
                )}
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Complete profile information for this user.
            </Typography>

            {/* Basic Information */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>Basic Information</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <InfoRow label="Full Name" value={userName} />
              <InfoRow label="Email" value={userEmail} />
              <InfoRow label="Phone" value={userData?.profileDetails?.personalDetails?.mobile || '-'} />
              <InfoRow label="Username" value={userData?.userName || '-'} />
              <InfoRow label="Gender" value={(userData as any)?.gender || '-'} />
              <InfoRow label="Date of Birth" value={(userData as any)?.dob || '-'} />
              <InfoRow label="Category" value={(userData as any)?.profileDetails?.personalDetails?.category || '-'} />
              <InfoRow label="Mother Tongue" value={(userData as any)?.profileDetails?.personalDetails?.domicileMedium || '-'} />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Organization & Professional */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Organization & Professional</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <InfoRow label="Organization" value={userData?.rootOrgName || '-'} />
              <InfoRow label="Channel" value={userData?.channel || '-'} />
              <InfoRow label="Department" value={(userData as any)?.profileDetails?.employmentDetails?.departmentName || '-'} />
              <InfoRow label="Group" value={(userData as any)?.profileDetails?.professionalDetails?.[0]?.group || '-'} />
              <InfoRow label="Designation" value={(userData as any)?.profileDetails?.professionalDetails?.[0]?.designation || '-'} />
              <InfoRow label="Employee ID" value={(userData as any)?.profileDetails?.personalDetails?.employeeCode || '-'} />
              <InfoRow label="Office Pin Code" value={(userData as any)?.profileDetails?.personalDetails?.pinCode || '-'} />
              <InfoRow label="User Type" value={userData?.profileUserType?.type || '-'} />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Status & Verification */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status & Verification</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <InfoRow label="User Status" value={isActive ? 'Active' : 'Inactive'} />
              <InfoRow label="Profile Status" value={userData?.profileDetails?.profileStatus || '-'} />
              <InfoRow label="Profile Group Status" value={(userData as any)?.profileDetails?.profileGroupStatus || '-'} />
              <InfoRow label="Profile Designation Status" value={(userData as any)?.profileDetails?.profileDesignationStatus || '-'} />
              <InfoRow label="Email Verified" value={userData?.emailVerified ? 'Yes' : 'No'} />
              <InfoRow label="Phone Verified" value={userData?.phoneVerified ? 'Yes' : 'No'} />
              <InfoRow label="Created Date" value={userData?.createdDate ? new Date(userData.createdDate).toLocaleString() : '-'} />
              <InfoRow label="Last Login" value={userData?.lastLoginTime ? new Date(userData.lastLoginTime).toLocaleString() : '-'} />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* System / External IDs */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>System & External IDs</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <InfoRow label="Root Org ID" value={userData?.rootOrgId || '-'} />
              <InfoRow label="External System" value={(userData as any)?.profileDetails?.additionalProperties?.externalSystem || '-'} />
              <InfoRow label="External System ID" value={(userData as any)?.profileDetails?.additionalProperties?.externalSystemId || '-'} />
              <InfoRow label="Date of Retirement" value={(userData as any)?.profileDetails?.additionalProperties?.externalSystemDor || '-'} />
            </Box>

            {/* Cadre Details (if present) */}
            {(userData as any)?.profileDetails?.cadreDetails?.civilServiceType && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Cadre / Civil Service Details</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                  <InfoRow label="Type of Civil Service" value={(userData as any)?.profileDetails?.cadreDetails?.civilServiceType || '-'} />
                  <InfoRow label="Service" value={(userData as any)?.profileDetails?.cadreDetails?.civilServiceName || '-'} />
                  <InfoRow label="Cadre" value={(userData as any)?.profileDetails?.cadreDetails?.cadreName || '-'} />
                  <InfoRow label="Batch" value={(userData as any)?.profileDetails?.cadreDetails?.cadreBatch != null ? String((userData as any).profileDetails.cadreDetails.cadreBatch) : '-'} />
                  <InfoRow label="Controlling Authority" value={(userData as any)?.profileDetails?.cadreDetails?.cadreControllingAuthorityName || '-'} />
                  <InfoRow label="Central Deputation" value={(userData as any)?.profileDetails?.cadreDetails?.isOnCentralDeputation ? 'Yes' : 'No'} />
                </Box>
              </>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Roles */}
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Roles</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {(userData?.organisations?.[0]?.roles || userData?.roles || []).map((role: string) => (
                  <Chip key={role} label={role} size="small" />
                ))}
              </Box>
            </Box>

            {/* Organizations */}
            {userData?.organisations && userData.organisations.length > 0 && (
              <Box mb={1}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Organizations</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {userData.organisations.map((org) => (
                    <Chip key={org.organisationId} label={`${org.orgName} (${org.organisationId})`} size="small" sx={{ mb: 0.5 }} />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Profile (merged Edit Details + Primary Details) */}
      <TabPanel value={activeTab} index={1}>
        <EditProfileTab
          user={userData}
          canWrite={canWrite}
          loading={loading}
          moduleName={moduleState?.name || 'users'}
          onSaveSuccess={fetchUser}
          onToast={showToast}
        />
      </TabPanel>

      {/* Roles */}
      <TabPanel value={activeTab} index={2}>
        <ActionCard
          title="Manage User Roles"
          description="Add or remove roles for this user. Roles determine what actions and features the user can access in the platform."
          icon={<PersonIcon color="primary" />}
          buttonLabel="Manage Roles"
          onAction={() => setRoleDialogOpen(true)}
          disabled={!canWrite}
        >
          <Box mb={1}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Current Roles</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {(userData?.organisations?.[0]?.roles || []).map((role: string) => (
                <Chip key={role} label={role} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>
        </ActionCard>
      </TabPanel>

      {/* Password Reset */}
      <TabPanel value={activeTab} index={3}>
        <ActionCard
          title="Reset Password"
          description="Generate a password reset link for this user. The link will be sent to the user's registered email address."
          icon={<LockResetIcon color="primary" />}
          buttonLabel="Reset Password"
          onAction={() => setPasswordDialogOpen(true)}
          disabled={!canWrite}
          color="warning"
        >
          <Box>
            <InfoRow label="Email" value={userEmail} />
            <InfoRow label="Email Verified" value={userData?.emailVerified ? 'Yes' : 'No'} />
          </Box>
        </ActionCard>
      </TabPanel>

      {/* Migration */}
      <TabPanel value={activeTab} index={4}>
        <ActionCard
          title="Migrate User"
          description="Move this user to a different organization. This will transfer the user's account and data to the target organization."
          icon={<CompareArrowsIcon color="primary" />}
          buttonLabel="Migrate User"
          onAction={() => setMigrationDialogOpen(true)}
          disabled={!canWrite}
          color="warning"
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <InfoRow label="Current Organization" value={userData?.rootOrgName || '-'} />
            <InfoRow label="Channel" value={userData?.channel || '-'} />
          </Box>
        </ActionCard>
      </TabPanel>

      {/* Block/Unblock */}
      <TabPanel value={activeTab} index={5}>
        <ActionCard
          title={isActive ? 'Block User' : 'Unblock User'}
          description={isActive
            ? 'Block this user account. The user will no longer be able to log in or access the platform.'
            : 'Unblock this user account. The user will regain access to log in and use the platform.'
          }
          icon={isActive ? <BlockIcon color="error" /> : <LockOpenIcon color="success" />}
          buttonLabel={isActive ? 'Block User' : 'Unblock User'}
          onAction={() => setBlockDialogOpen(true)}
          disabled={!canWrite}
          color={isActive ? 'error' : 'success'}
          variant={isActive ? 'contained' : 'contained'}
        >
          <Box>
            <InfoRow label="Current Status" value={isActive ? 'Active' : 'Inactive / Blocked'} />
          </Box>
        </ActionCard>
      </TabPanel>

      {/* Certificates */}
      <TabPanel value={activeTab} index={6}>
        <ReissueCertificate userIdProp={userId} embedded canWrite={canWrite} />
      </TabPanel>

      {/* CBP Plan */}
      <TabPanel value={activeTab} index={7}>
        <CBPlanPage
          userIdProp={userId}
          emailProp={userEmail}
          rootOrgIdProp={rootOrgId}
          userNameProp={userName}
          embedded
        />
      </TabPanel>

      {/* Assigned CAP */}
      <TabPanel value={activeTab} index={8}>
        <AssignedCAPPage
          userIdProp={userId}
          emailProp={userEmail}
          userNameProp={userName}
          embedded
        />
      </TabPanel>

      {/* Content Access Settings */}
      <TabPanel value={activeTab} index={9}>
        <ContentAccessTab />
      </TabPanel>

      {/* ---- Dialogs ---- */}

      <RoleAssignmentDialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        user={userData}
        onRoleAssign={handleRoleAssignAction}
      />

      <PasswordResetDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        user={userData}
        onResetPassword={handlePasswordResetAction}
      />

      <UserMigrationDialog
        open={migrationDialogOpen}
        onClose={() => setMigrationDialogOpen(false)}
        user={userData}
        onMigrate={handleUserMigrateAction}
      />

      <UserBlockDialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        user={userData}
        onBlockUser={handleUserBlockUnblockAction}
        currentUserId={currentUser?.userId || ''}
      />

      <UserStatusUpdateDialog
        open={statusUpdateDialogOpen}
        onClose={() => setStatusUpdateDialogOpen(false)}
        user={userData}
        onConfirm={handleUserStatusUpdateAction}
      />

      <JsonViewerDialog
        open={viewJsonDialogOpen}
        onClose={() => setViewJsonDialogOpen(false)}
        title={`User Details: ${userName}`}
        data={userData}
      />

      {/* Toast */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      >
        <Alert variant="filled" severity={toast.severity} onClose={() => setToast(prev => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// -------------------- Helper Components --------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
