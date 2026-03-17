import React from 'react';
import {
  Box, Typography, Paper, Chip, Grid, Avatar, Tooltip, IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { UserProfile } from '../../../types/users';

interface UserSummaryCardProps {
  user: UserProfile;
}

export const UserSummaryCard: React.FC<UserSummaryCardProps> = ({ user }) => {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const email = user?.profileDetails?.personalDetails?.primaryEmail || user?.email || '-';
  const phone = user?.profileDetails?.personalDetails?.mobile || user?.phone || '-';
  const org = user?.rootOrgName || '-';
  const isActive = user?.status === 1;
  const profileStatus = user?.profileDetails?.profileStatus || '-';
  const roles = user?.organisations?.[0]?.roles || user?.roles || [];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="flex-start" gap={3}>
        <Avatar
          sx={{
            width: 64, height: 64,
            bgcolor: isActive ? 'primary.main' : 'grey.500',
            fontSize: '1.5rem'
          }}
        >
          {initials || '?'}
        </Avatar>

        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              {name || 'Unknown User'}
            </Typography>
            <Chip
              label={isActive ? 'Active' : 'Inactive'}
              color={isActive ? 'success' : 'error'}
              size="small"
            />
            {profileStatus !== '-' && (
              <Chip
                label={profileStatus}
                variant="outlined"
                size="small"
                color={profileStatus === 'VERIFIED' ? 'success' : 'warning'}
              />
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Organization</Typography>
              <Typography variant="body2" fontWeight={500}>{org}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>
                  {email}
                </Typography>
                {email !== '-' && (
                  <Tooltip title="Copy email">
                    <IconButton size="small" onClick={() => handleCopy(email)} sx={{ p: 0.25 }}>
                      <ContentCopyIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Phone</Typography>
              <Typography variant="body2" fontWeight={500}>{phone}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Roles</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.25}>
                {roles.length > 0 ? roles.map((role: string) => (
                  <Chip key={role} label={role} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                )) : <Typography variant="body2">-</Typography>}
              </Box>
            </Grid>
          </Grid>

          <Box display="flex" gap={3} mt={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">User ID</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {user.identifier || user.userId || '-'}
                </Typography>
                <Tooltip title="Copy User ID">
                  <IconButton size="small" onClick={() => handleCopy(user.identifier || user.userId)} sx={{ p: 0.25 }}>
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2">
                {user.createdDate ? new Date(user.createdDate).toLocaleDateString() : '-'}
              </Typography>
            </Box>
            {user.lastLoginTime && (
              <Box>
                <Typography variant="caption" color="text.secondary">Last Login</Typography>
                <Typography variant="body2">
                  {new Date(user.lastLoginTime).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
