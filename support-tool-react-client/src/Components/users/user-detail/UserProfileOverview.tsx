import React from 'react';
import {
  Box, Typography, Card, CardContent, Divider, Chip, Button
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { UserProfile } from '../../../types/users';

// -------------------- Props --------------------

interface UserProfileOverviewProps {
  user: UserProfile;
  canWrite: boolean;
  onViewRawJson: () => void;
  onReassignUser: () => void;
}

// -------------------- Helper --------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value || '-'}</Typography>
    </Box>
  );
}

const gridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
  gap: 2,
  mb: 3,
};

// -------------------- Helpers for safe access --------------------

function getPersonalDetail(user: any, key: string): string {
  return user?.profileDetails?.personalDetails?.[key] ?? '';
}

function getEmploymentDetail(user: any, key: string): string {
  return user?.profileDetails?.employmentDetails?.[key] ?? '';
}

function getProfessionalDetail(user: any, key: string): string {
  const prof = user?.profileDetails?.professionalDetails;
  if (Array.isArray(prof) && prof.length > 0) {
    return prof[0]?.[key] ?? '';
  }
  return '';
}

function getAdditionalProp(user: any, key: string): string {
  return user?.profileDetails?.additionalProperties?.[key] ?? '';
}

function getCadreDetail(user: any, key: string): string {
  return user?.profileDetails?.cadreDetails?.[key] ?? '';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

// -------------------- Component --------------------

export const UserProfileOverview: React.FC<UserProfileOverviewProps> = ({
  user,
  canWrite,
  onViewRawJson,
  onReassignUser,
}) => {
  const isActive = user?.status === 1;
  const isNotMyUser = user?.profileDetails?.profileStatus === 'NOT-MY-USER';

  // --- Personal ---
  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const primaryEmail = getPersonalDetail(user, 'primaryEmail');
  const mobile = getPersonalDetail(user, 'mobile') || user?.maskedPhone || '';
  const gender = getPersonalDetail(user, 'gender');
  const dob = getPersonalDetail(user, 'dob');
  const category = getPersonalDetail(user, 'category');
  const motherTongue = getPersonalDetail(user, 'domicileMedium');
  const isCadre = getPersonalDetail(user, 'isCadre');

  // --- Organisation & Professional ---
  const departmentName = getEmploymentDetail(user, 'departmentName');
  const employeeCode = getEmploymentDetail(user, 'employeeCode');
  const pinCode = getEmploymentDetail(user, 'pinCode');
  const group = getProfessionalDetail(user, 'group');
  const designation = getProfessionalDetail(user, 'designation');
  const userType = user?.profileUserType && Object.keys(user.profileUserType).length > 0
    ? (user.profileUserType as any)?.type || JSON.stringify(user.profileUserType)
    : '';

  // --- Status & Verification ---
  const profileStatus = user?.profileDetails?.profileStatus || '';
  const profileGroupStatus = (user as any)?.profileDetails?.profileGroupStatus || '';
  const profileDesignationStatus = (user as any)?.profileDetails?.profileDesignationStatus || '';
  const lastLogin = user?.last_login || user?.lastLoginTime || null;
  const firstLogin = (user as any)?.first_login || null;

  // --- System / External IDs ---
  const externalSystem = getAdditionalProp(user, 'externalSystem');
  const externalSystemId = getAdditionalProp(user, 'externalSystemId');
  const externalSystemDor = getAdditionalProp(user, 'externalSystemDor');

  // --- Cadre Details ---
  const hasCadre = !!getCadreDetail(user, 'civilServiceType');
  const cadreDetails = user?.profileDetails && (user.profileDetails as any)?.cadreDetails;

  // --- Roles ---
  const roles = user?.organisations?.[0]?.roles || user?.roles || [];

  // --- Org Custom Fields ---
  const orgCustomFields: any[] = (user as any)?.orgCustomFields || [];

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">User Profile Overview</Typography>
          <Box display="flex" gap={1}>
            <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={onViewRawJson}>
              View Raw JSON
            </Button>
            {isNotMyUser && canWrite && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<AssignmentTurnedInIcon />}
                onClick={onReassignUser}
              >
                Reassign User
              </Button>
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Complete profile information for this user.
        </Typography>

        {/* ===== Basic Information ===== */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
          Basic Information
        </Typography>
        <Box sx={gridSx}>
          <InfoRow label="Full Name" value={userName} />
          <InfoRow label="Email" value={primaryEmail} />
          <InfoRow label="Phone" value={mobile} />
          <InfoRow label="Username" value={user?.userName || '-'} />
          <InfoRow label="Gender" value={gender} />
          <InfoRow label="Date of Birth" value={dob} />
          <InfoRow label="Category" value={category} />
          <InfoRow label="Mother Tongue" value={motherTongue} />
          <InfoRow label="Masked Email" value={user?.maskedEmail || '-'} />
          <InfoRow label="Masked Phone" value={user?.maskedPhone || '-'} />
          <InfoRow label="Recovery Email" value={user?.recoveryEmail || '-'} />
          <InfoRow label="Recovery Phone" value={user?.recoveryPhone || '-'} />
          <InfoRow label="Is Cadre" value={isCadre ? String(isCadre) : '-'} />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ===== Organization & Professional ===== */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Organization &amp; Professional
        </Typography>
        <Box sx={gridSx}>
          <InfoRow label="Organization" value={user?.rootOrgName || '-'} />
          <InfoRow label="Channel" value={user?.channel || '-'} />
          <InfoRow label="Department" value={departmentName} />
          <InfoRow label="Group" value={group} />
          <InfoRow label="Designation" value={designation} />
          <InfoRow label="Employee ID" value={employeeCode} />
          <InfoRow label="Office Pin Code" value={pinCode} />
          <InfoRow label="User Type" value={userType} />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ===== Status & Verification ===== */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Status &amp; Verification
        </Typography>
        <Box sx={gridSx}>
          <InfoRow label="User Status" value={isActive ? 'Active' : 'Inactive'} />
          <InfoRow label="Profile Status" value={profileStatus} />
          <InfoRow label="Profile Group Status" value={profileGroupStatus} />
          <InfoRow label="Profile Designation Status" value={profileDesignationStatus} />
          <InfoRow label="Email Verified" value={user?.emailVerified ? 'Yes' : 'No'} />
          <InfoRow label="Phone Verified" value={user?.phoneVerified ? 'Yes' : 'No'} />
          <InfoRow label="State Validated" value={user?.stateValidated ? 'Yes' : 'No'} />
          <InfoRow label="Is Deleted" value={user?.isDeleted ? 'Yes' : 'No'} />
          <InfoRow label="Created Date" value={formatDate(user?.createdDate)} />
          <InfoRow label="Updated Date" value={formatDate(user?.updatedDate)} />
          <InfoRow label="Last Login" value={formatDate(lastLogin)} />
          <InfoRow label="First Login" value={formatDate(firstLogin)} />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ===== System & External IDs ===== */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          System &amp; External IDs
        </Typography>
        <Box sx={gridSx}>
          <InfoRow label="User ID" value={user?.userId || user?.id || '-'} />
          <InfoRow label="Root Org ID" value={user?.rootOrgId || '-'} />
          <InfoRow label="Registry ID" value={user?.registryId || '-'} />
          <InfoRow label="NodeBB ID" value={user?.nodebbid != null ? String(user.nodebbid) : '-'} />
          <InfoRow label="External System" value={externalSystem} />
          <InfoRow label="External System ID" value={externalSystemId} />
          <InfoRow label="Date of Retirement" value={externalSystemDor} />
          <InfoRow label="Created By" value={user?.createdBy || '-'} />
          <InfoRow label="Updated By" value={user?.updatedBy || '-'} />
          <InfoRow label="Flags Value" value={user?.flagsValue != null ? String(user.flagsValue) : '-'} />
        </Box>

        {/* ===== Cadre / Civil Service Details ===== */}
        {hasCadre && cadreDetails && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cadre / Civil Service Details
            </Typography>
            <Box sx={gridSx}>
              <InfoRow label="Type of Civil Service" value={cadreDetails.civilServiceType || '-'} />
              <InfoRow label="Service" value={cadreDetails.civilServiceName || '-'} />
              <InfoRow label="Cadre" value={cadreDetails.cadreName || '-'} />
              <InfoRow label="Batch" value={cadreDetails.cadreBatch != null ? String(cadreDetails.cadreBatch) : '-'} />
              <InfoRow label="Controlling Authority" value={cadreDetails.cadreControllingAuthorityName || '-'} />
              <InfoRow label="Central Deputation" value={cadreDetails.isOnCentralDeputation ? 'Yes' : 'No'} />
            </Box>
          </>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* ===== Roles ===== */}
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Roles</Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {roles.length > 0 ? roles.map((role: string) => (
              <Chip key={role} label={role} size="small" />
            )) : (
              <Typography variant="body2" color="text.secondary">No roles assigned</Typography>
            )}
          </Box>
        </Box>

        {/* ===== Organizations ===== */}
        {user?.organisations && user.organisations.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Organizations</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {user.organisations.map((org) => (
                <Chip
                  key={org.organisationId}
                  label={`${org.orgName} (${org.organisationId})`}
                  size="small"
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ===== Org Custom Fields ===== */}
        {orgCustomFields.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Organization Custom Fields
            </Typography>
            {orgCustomFields.map((orgCf: any, idx: number) => (
              <Box key={idx} sx={{ mb: 2 }}>
                {orgCf.orgId && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Org ID: {orgCf.orgId}
                  </Typography>
                )}
                <Box sx={gridSx}>
                  {(orgCf.fields || []).map((field: Record<string, string>, fIdx: number) => {
                    const [key, val] = Object.entries(field)[0] || [];
                    return key ? <InfoRow key={fIdx} label={key} value={val || '-'} /> : null;
                  })}
                </Box>
              </Box>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};
