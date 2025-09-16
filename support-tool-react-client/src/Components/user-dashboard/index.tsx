import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  History as HistoryIcon,
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { analyticsService, AnalyticsStats } from '../../services/analytics.service';
import { AuditLogs } from '../audit-logs';
import { AppContext } from '../../Context/AppContext';
import { appContextType, IUserConfig } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Grid item xs={12} sm={6}>
    <Card sx={{ 
      height: '100%', 
      border: (theme) => `1px solid ${theme.palette.divider}`, 
      boxShadow: 'none',
      borderRadius: 2
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color: color, mt: -1 }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {(value || 0).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
};

const getModuleActivityChartData = (stats: AnalyticsStats | null) => {
  if (!stats?.auditLogsByModule) return null;
  return {
    labels: stats.auditLogsByModule.map((item: any) => item.module),
    datasets: [
      {
        label: 'Activity Count',
        data: stats.auditLogsByModule.map((item: any) => item.count),
        backgroundColor: ['#3f51b5', '#f50057', '#ff9800', '#4caf50', '#9c27b0'],
      },
    ],
  };
};

const getTimelineChartData = (stats: AnalyticsStats | null) => {
  if (!stats?.auditLogsTimeline) return null;
  return {
    labels: stats.auditLogsTimeline.map((item: any) => new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Successful Operations',
        data: stats.auditLogsTimeline.map((item: any) => item.success),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.2)',
        fill: true,
      },
    ],
  };
};

export const UserDashboard: React.FC = () => {
  const { user, userRoles } = useContext(AppContext) as appContextType;

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    setLoadingStats(true);
    setStatsError(null);
    try {
      const response: any = await analyticsService.getAnalyticsStats({ userId: user.userId });
      setStats(response.data || null);
    } catch (error) {
      console.error(`Error fetching stats for user ${user.userId}:`, error);
      setStatsError('Failed to load user statistics.');
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.userId) {
      fetchUserStats();
    }
  }, [user?.userId, fetchUserStats]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          User Dashboard
        </Typography>
        <Typography color="text.secondary">
          Welcome, {user?.name || user?.userName}. Here's an overview of your activity.
        </Typography>
      </Box>

      {user ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 2 }}>
                <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}>
                  {user.userName?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">{user?.name || user.userName}</Typography>
                <Typography color="text.secondary" variant="body2">User ID: {user.userId}</Typography>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {(userRoles || []).map((roleObj: { role: string }, index: number) => (
                    roleObj?.role && <Chip key={`${roleObj.role}-${index}`} label={roleObj.role.toUpperCase()} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <StatCard 
                  title="Total Activities"
                  value={stats?.recentAuditLogs || 0}
                  icon={<HistoryIcon sx={{ fontSize: 32 }} />}
                  color="primary.main"
                />
                <StatCard
                  title="Successful"
                  value={stats?.successfulOperations || 0}
                  icon={<SuccessIcon sx={{ fontSize: 32 }} />}
                  color="success.main"
                />
                <StatCard
                  title="Failures"
                  value={stats?.failedOperations || 0}
                  icon={<ErrorIcon sx={{ fontSize: 32 }} />}
                  color="error.main"
                />
                <StatCard
                  title="Modules Used"
                  value={stats?.totalModules || 0}
                  icon={<PeopleIcon sx={{ fontSize: 32 }} />}
                  color="warning.main"
                />
              </Grid>
            </Grid>
          </Grid>

          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
          ) : statsError ? (
            <Alert severity="error" sx={{ mt: 2 }}>{statsError}</Alert>
          ) : stats ? (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Activity Timeline (Last 7 Days)</Typography>
                    <Box sx={{ position: 'relative', height: '300px' }}>
                      {getTimelineChartData(stats) ? (
                        <Line data={getTimelineChartData(stats)!} options={chartOptions} />
                      ) : <Typography color="text.secondary">No timeline data available.</Typography>}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Activity by Module</Typography>
                    <Box sx={{ position: 'relative', height: '300px' }}>
                      {getModuleActivityChartData(stats) ? (
                        <Doughnut data={getModuleActivityChartData(stats)!} options={doughnutOptions} />
                      ) : <Typography color="text.secondary">No module activity data available.</Typography>}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : null}

          <Paper sx={{ p: 3, mt: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" component="h2" fontWeight="medium">
                Recent Activity
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <AuditLogs userId={user.userId} />
          </Paper>
        </>
      ) : (
        <Alert severity="info">
          Loading user data... If this persists, please try logging in again.
        </Alert>
      )}
    </Box>
  );
};