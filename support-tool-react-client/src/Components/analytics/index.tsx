import React, { useEffect, useState, useCallback } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Grid2, LinearProgress, Box, TextField, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { 
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  ErrorOutline as ErrorIcon,
  ListAlt as AuditIcon
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { analyticsService, AnalyticsStats } from "../../services/analytics.service";
import { useNavigate } from "react-router-dom";
import { format, subDays } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsStatsLocal {
  totalUsers: number;
  totalModules: number;
  recentAuditLogs: number;
  failedOperations: number;
  successfulOperations: number;
}

type DateRangeOption = '30d' | '60d' | '90d' | '6m' | '1y' | 'custom';

const DATE_RANGE_OPTIONS = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '60d', label: 'Last 60 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last 1 Year' },
  { value: 'custom', label: 'Custom Date Range' },
] as const;

export const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [stats, setStats] = useState<AnalyticsStatsLocal>({
    totalUsers: 0,
    totalModules: 0,
    recentAuditLogs: 0,
    failedOperations: 0,
    successfulOperations: 0,
  });

  const navigate = useNavigate();
  // const { modulePermissions } = useContext(AppContext) as appContextType;

  // Function to handle date range selection
  const handleDateRangeChange = (newRange: DateRangeOption) => {
    setDateRange(newRange);
    
    if (newRange !== 'custom') {
      const now = new Date();
      const start = new Date();
      
      switch (newRange) {
        case '30d':
          start.setDate(now.getDate() - 30);
          break;
        case '60d':
          start.setDate(now.getDate() - 60);
          break;
        case '90d':
          start.setDate(now.getDate() - 90);
          break;
        case '6m':
          start.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      setStartDate(start);
      setEndDate(now);
    }
  };

  const fetchAnalyticsStats = useCallback(async () => {
    setLoading(true);
    try {
      // Convert dates to API format or use preset range
      let apiParams;
      if (dateRange === 'custom' && startDate && endDate) {
        apiParams = {
          startDate: startDate,
          endDate: endDate
        };
      } else {
        apiParams = dateRange; // Use preset range like '30d', '60d', etc.
      }
      
      console.log('Fetching analytics with params:', apiParams); // Debug log
      const response: any = await analyticsService.getAnalyticsStats(apiParams);
      console.log('Analytics API Response:', response); // Debug log
      
      // Extract data from nested response structure
      const data = response.data || response;
      setAnalyticsData(data);

      // Update basic stats
      setStats({
        totalUsers: data.totalUsers || 0,
        totalModules: data.totalModules || 0,
        recentAuditLogs: data.recentAuditLogs || 0,
        failedOperations: data.failedOperations || 0,
        successfulOperations: data.successfulOperations || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics stats:", error);
      // Generate dynamic mock data based on date range for development
      const generateMockData = (range: DateRangeOption): AnalyticsStats => {
        const multipliers = {
          '30d': { users: 1, actions: 1, logs: 1 },
          '60d': { users: 1.8, actions: 1.9, logs: 1.7 },
          '90d': { users: 2.5, actions: 2.8, logs: 2.3 },
          '6m': { users: 4.2, actions: 5.5, logs: 4.8 },
          '1y': { users: 8.1, actions: 12.2, logs: 10.5 },
          'custom': { users: 1.5, actions: 1.8, logs: 1.6 }
        };
        
        const mult = multipliers[range] || multipliers['30d'];
        
        return {
          totalUsers: Math.floor(1250 * mult.users),
          activeUsers: Math.floor(892 * mult.users),
          totalModules: 8,
          activeModules: 7,
          totalActions: Math.floor(3450 * mult.actions),
          recentActions: Math.floor(125 * mult.actions),
          recentAuditLogs: Math.floor(45 * mult.logs),
          totalAuditLogs: Math.floor(205 * mult.logs),
          failedOperations: Math.floor(12 * mult.logs),
          successfulOperations: Math.floor(188 * mult.logs),
          userGrowth: Array.from({ length: 5 }, (_, i) => ({
            date: format(subDays(new Date(), 4 - i), 'yyyy-MM-dd'),
            count: Math.floor((10 + Math.random() * 15) * mult.users)
          })),
          auditLogsByModule: [
            { module: 'users', count: Math.floor(150 * mult.logs) },
            { module: 'system-settings', count: Math.floor(80 * mult.logs) },
            { module: 'contents', count: Math.floor(65 * mult.logs) },
            { module: 'modules', count: Math.floor(45 * mult.logs) },
          ],
          auditLogsByAction: [
            { action: 'CREATE_USER', count: Math.floor(85 * mult.actions) },
            { action: 'UPDATE_CONFIG', count: Math.floor(70 * mult.actions) },
            { action: 'REISSUE_CERTIFICATE', count: Math.floor(60 * mult.actions) },
            { action: 'DELETE_CONTENT', count: Math.floor(25 * mult.actions) },
          ],
          auditLogsByStatus: [
            { status: 'SUCCESS', count: Math.floor(188 * mult.logs) },
            { status: 'FAILURE', count: Math.floor(12 * mult.logs) },
            { status: 'PENDING', count: Math.floor(5 * mult.logs) },
          ],
          auditLogsTimeline: Array.from({ length: 7 }, (_, i) => ({
            date: format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'),
            success: Math.floor((40 + Math.random() * 20) * mult.logs),
            failure: Math.floor((2 + Math.random() * 4) * mult.logs)
          })),
          moduleActivity: [
            { module: 'User Certificates', count: Math.floor(45 * mult.actions) },
            { module: 'User Management', count: Math.floor(35 * mult.actions) },
            { module: 'System Configuration', count: Math.floor(30 * mult.actions) },
          ],
          timelineData: Array.from({ length: 7 }, (_, i) => ({
            date: format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'),
            users: Math.floor((120 + Math.random() * 30) * mult.users),
            actions: Math.floor((450 + Math.random() * 100) * mult.actions)
          })),
          actionTypes: [
            { type: 'Create', count: Math.floor(120 * mult.actions) },
            { type: 'Update', count: Math.floor(95 * mult.actions) },
            { type: 'Delete', count: Math.floor(30 * mult.actions) },
          ],
          statusDistribution: [
            { status: 'Success', count: Math.floor(188 * mult.logs) },
            { status: 'Failed', count: Math.floor(12 * mult.logs) },
            { status: 'Pending', count: Math.floor(5 * mult.logs) },
          ]
        };
      };
      
      const mockData = generateMockData(dateRange);
      setAnalyticsData(mockData);
      setStats({
        totalUsers: mockData.totalUsers || 0,
        totalModules: mockData.totalModules || 0,
        recentAuditLogs: mockData.recentAuditLogs || 0,
        failedOperations: mockData.failedOperations || 0,
        successfulOperations: mockData.successfulOperations || 0,
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, dateRange]);

  useEffect(() => {
    fetchAnalyticsStats();
  }, [fetchAnalyticsStats]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Chart configurations
  const getTimelineChartData = () => {
    if (!analyticsData?.auditLogsTimeline) return null;
    
    return {
      labels: analyticsData.auditLogsTimeline.map((item: any) => format(new Date(item.date), 'MMM dd')),
      datasets: [
        {
          label: 'Successful Operations',
          data: analyticsData.auditLogsTimeline.map((item: any) => item.success),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: 'Failed Operations',
          data: analyticsData.auditLogsTimeline.map((item: any) => item.failure),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
      ],
    };
  };

  const getModuleActivityChartData = () => {
    if (!analyticsData?.auditLogsByModule) return null;
    
    return {
      labels: analyticsData.auditLogsByModule.map((item: any) => item.module),
      datasets: [
        {
          label: 'Activity Count',
          data: analyticsData.auditLogsByModule.map((item: any) => item.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
        },
      ],
    };
  };

  const getStatusChartData = () => {
    if (!analyticsData?.auditLogsByStatus) return null;
    
    return {
      labels: analyticsData.auditLogsByStatus.map((item: any) => item.status),
      datasets: [
        {
          data: analyticsData.auditLogsByStatus.map((item: any) => item.count),
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 205, 86, 0.8)',
          ],
        },
      ],
    };
  };

  const getActionChartData = () => {
    if (!analyticsData?.auditLogsByAction) return null;
    
    return {
      labels: analyticsData.auditLogsByAction.map((item: any) => item.action),
      datasets: [
        {
          label: 'Action Count',
          data: analyticsData.auditLogsByAction.map((item: any) => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const StatCard = ({ title, value, icon, color, onClick }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }) => (
    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
      <Card 
        sx={{ 
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? { boxShadow: 3 } : {}
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography color="textSecondary" gutterBottom variant="h6">
                {title}
              </Typography>
              <Typography variant="h4" component="h2" sx={{ color }}>
                {(value || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ color }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid2>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            Analytics Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AuditIcon />}
            onClick={() => navigate('/audit-logs')}
            size="small"
          >
            View Audit Logs
          </Button>
        </Box>
        
        {/* Date Range Selector */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => handleDateRangeChange(e.target.value as DateRangeOption)}
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {dateRange === 'custom' && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="From"
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>to</Typography>
              <TextField
                label="To"
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid2 container spacing={3} sx={{ mb: 4 }}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<PeopleIcon sx={{ fontSize: 40 }} />}
          color="#1976d2"
          onClick={() => handleNavigate('/users')}
        />
        <StatCard
          title="Total Modules"
          value={stats.totalModules}
          icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
          color="#2e7d32"
          onClick={() => handleNavigate('/modules')}
        />
        <StatCard
          title="Recent Audit Logs"
          value={stats.recentAuditLogs}
          icon={<HistoryIcon sx={{ fontSize: 40 }} />}
          color="#ed6c02"
          onClick={() => handleNavigate('/audit-logs')}
        />
        <StatCard
          title="Failed Operations"
          value={stats.failedOperations}
          icon={<ErrorIcon sx={{ fontSize: 40 }} />}
          color="#d32f2f"
        />
      </Grid2>

      {/* Charts Section */}
      <Grid2 container spacing={3} sx={{ mb: 4 }}>
        {/* Timeline Chart */}
        <Grid2 size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Operations Timeline
              </Typography>
              {getTimelineChartData() ? (
                <Line data={getTimelineChartData()!} options={chartOptions} />
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">No timeline data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>

        {/* Status Distribution */}
        <Grid2 size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Distribution
              </Typography>
              {getStatusChartData() ? (
                <Doughnut data={getStatusChartData()!} options={doughnutOptions} />
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">No status data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Module Activity and Actions */}
      <Grid2 container spacing={3}>
        {/* Module Activity */}
        <Grid2 size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Module Activity
              </Typography>
              {getModuleActivityChartData() ? (
                <Bar data={getModuleActivityChartData()!} options={chartOptions} />
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">No module activity data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>

        {/* Action Types */}
        <Grid2 size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Action Types
              </Typography>
              {getActionChartData() ? (
                <Bar data={getActionChartData()!} options={chartOptions} />
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">No action data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default Analytics;
