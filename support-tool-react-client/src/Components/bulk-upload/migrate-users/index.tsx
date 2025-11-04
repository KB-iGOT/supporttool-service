
import React, { useState, useCallback, useRef, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Collapse,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  GetApp as GetAppIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Cached as CachedIcon,
  Upgrade as UpgradeIcon
} from '@mui/icons-material';
import Papa, { ParseResult } from 'papaparse';
import { useLocation, useNavigate } from 'react-router-dom';
import { usersService } from '../../../services/users.service';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';
import { UserProfile } from '../../../types/users';
import sampleCsv from '../../../assets/sample-files/migrate-users.csv';

interface CsvData {
  email: string;
  phone: string;
  channel: string;
  userId: string;
}

interface MigrationFailure {
  email?: string;
  phone?: string;
  channel?: string;
  userId?: string;
  reason: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MigrateUsers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setNotification, user } = useContext(AppContext) as appContextType;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get current module info from location state
  const moduleState = location.state?.module || { name: 'Migrate Users' };
  
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'validate' | 'migrate' | 'results'>('upload');
  const [usersToMigrate, setUsersToMigrate] = useState<UserProfile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Migration options
  const [migrationOptions, setMigrationOptions] = useState({
    forceMigration: true,
    softDeleteOldOrg: true,
    notifyMigration: false
  });
  
  const [migrationResult, setMigrationResult] = useState<{ success: UserProfile[]; failure: MigrationFailure[] }>({ success: [], failure: [] });
  const [resultTab, setResultTab] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const processFile = (selectedFile: File | undefined) => {
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.toLowerCase().endsWith('.csv')) {
        setNotification({
          open: true,
          message: 'Invalid file type. Please upload a CSV file.',
          severity: 'error'
        });
        setFile(null);
        setCsvData([]);
        return;
      }

      const maxSize = 400 * 1024 * 1024; // 400 MB
      if (selectedFile.size > maxSize) {
        setNotification({
          open: true,
          message: 'File size exceeds the 400 MB limit.',
          severity: 'error'
        });
        setFile(null);
        setCsvData([]);
        return;
      }

      setFile(selectedFile);
      Papa.parse<CsvData>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string): string => {
          const lowerCaseHeader = header.toLowerCase().replace(/ /g, '');
          if (lowerCaseHeader === 'emailid' || lowerCaseHeader === 'email') {
            return 'email';
          }
          if (lowerCaseHeader === 'mobilenumber' || lowerCaseHeader === 'phone' || lowerCaseHeader === 'phonenumber') {
            return 'phone';
          }
          if (lowerCaseHeader === 'channel' || lowerCaseHeader === 'organization' || lowerCaseHeader === 'organisation') {
            return 'channel';
          }
          if (lowerCaseHeader === 'userid' || lowerCaseHeader === 'identifier' || lowerCaseHeader === 'id') {
            return 'userId';
          }
          return header;
        },
        complete: (results: ParseResult<CsvData>) => {
          const data = results.data.filter((row: CsvData) => (row.email || row.phone || row.userId) && row.channel);
          if (data.length === 0) {
            setNotification({
              open: true,
              message: 'CSV file must contain at least one row with an "email", "phone", or "userId" column and a "channel" column.',
              severity: 'error'
            });
            return;
          }
          setCsvData(data);
          setError(null);
          setNotification({
            open: true,
            message: `Successfully loaded ${data.length} user records from CSV file.`,
            severity: 'success'
          });
        }
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleFetchUsers = async () => {
    if (!csvData || csvData.length === 0) {
      setNotification({
        open: true,
        message: 'No valid data to process.',
        severity: 'error'
      });
      return;
    }
    setLoading(true);
    setError(null);
    setUsersToMigrate([]);
    const usersToProcess: UserProfile[] = [];
    const processingErrors: MigrationFailure[] = [];
  
    try {
      const emails = csvData.map(d => d.email).filter(Boolean) as string[];
      const phones = csvData.map(d => d.phone).filter(Boolean) as string[];
      const userIds = csvData.map(d => d.userId).filter(Boolean) as string[];
      
      const searchFields = ["userId", "email", "firstName", "lastName", "phone", "rootOrgId", "channel", "roles", "profileDetails", "createdDate", "rootOrgName", "organisations", "username", "status"];
  
      const userMapByEmail = new Map<string, UserProfile>();
      const userMapByPhone = new Map<string, UserProfile>();
      const userMapByUserId = new Map<string, UserProfile>();
  
      if (emails.length > 0) {
        const emailResponse = await usersService.getUsers({ request: { filters: { email: emails }, fields: searchFields } });
        emailResponse.result.response.content.forEach((user: UserProfile) => userMapByEmail.set(user.profileDetails.personalDetails.primaryEmail.toLowerCase(), user));
      }
  
      if (phones.length > 0) {
        const phoneResponse = await usersService.getUsers({ request: { filters: { phone: phones }, fields: searchFields } });
        phoneResponse.result.response.content.forEach((user: UserProfile) => userMapByPhone.set(String(user.profileDetails.personalDetails.mobile), user));
      }

      if (userIds.length > 0) {
        const userIdResponse = await usersService.getUsers({ request: { filters: { identifier: userIds }, fields: searchFields } });
        userIdResponse.result.response.content.forEach((user: UserProfile) => {
          userMapByUserId.set(user.userId, user);
          // Also map by identifier if different from userId
          if (user.identifier && user.identifier !== user.userId) {
            userMapByUserId.set(user.identifier, user);
          }
        });
      }
  
      const processedUserIds = new Set<string>();
  
      for (const row of csvData) {
        const email = row.email?.trim().toLowerCase();
        const phone = row.phone?.trim();
        const userId = row.userId?.trim();
        const targetChannel = row.channel?.trim();

        // Priority: userId > email+phone > email > phone
        if (userId) {
          const user = userMapByUserId.get(userId);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.channel === targetChannel) {
                processingErrors.push({ userId, channel: targetChannel, reason: 'User is already in the target channel.' });
                processedUserIds.add(user.userId);
                continue;
              }
              (user as any).targetChannel = targetChannel;
              usersToProcess.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            processingErrors.push({ userId, channel: targetChannel, reason: 'User not found for userId/identifier.' });
          }
        } else if (email && phone) {
          const userByEmail = userMapByEmail.get(email);
          const userByPhone = userMapByPhone.get(phone);
          if (userByEmail && userByPhone) {
            if (userByEmail.userId === userByPhone.userId) {
              if (!processedUserIds.has(userByEmail.userId)) {
                if (userByEmail.channel === targetChannel) {
                  processingErrors.push({ email, phone, channel: targetChannel, reason: 'User is already in the target channel.' });
                  processedUserIds.add(userByEmail.userId);
                  continue;
                }
                // Add target channel to user object for migration
                (userByEmail as any).targetChannel = targetChannel;
                usersToProcess.push(userByEmail);
                processedUserIds.add(userByEmail.userId);
              }
            } else {
              processingErrors.push({ email, phone, channel: targetChannel, reason: 'Email and phone do not belong to the same user.' });
            }
          } else if (userByEmail && !userByPhone) {
            processingErrors.push({ email, phone, channel: targetChannel, reason: `User found for email, but not for phone.` });
          } else if (!userByEmail && userByPhone) {
            processingErrors.push({ email, phone, channel: targetChannel, reason: `User found for phone, but not for email.` });
          } else {
            processingErrors.push({ email, phone, channel: targetChannel, reason: 'User not found for either email or phone.' });
          }
        } else if (email) {
          const user = userMapByEmail.get(email);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.channel === targetChannel) {
                processingErrors.push({ email, channel: targetChannel, reason: 'User is already in the target channel.' });
                processedUserIds.add(user.userId);
                continue;
              }
              (user as any).targetChannel = targetChannel;
              usersToProcess.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            processingErrors.push({ email, channel: targetChannel, reason: 'User not found.' });
          }
        } else if (phone) {
          const user = userMapByPhone.get(phone);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.channel === targetChannel) {
                processingErrors.push({ phone, channel: targetChannel, reason: 'User is already in the target channel.' });
                processedUserIds.add(user.userId);
                continue;
              }
              (user as any).targetChannel = targetChannel;
              usersToProcess.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            processingErrors.push({ phone, channel: targetChannel, reason: 'User not found.' });
          }
        }
      }
      
      setUsersToMigrate(usersToProcess);
      setMigrationResult({ success: [], failure: processingErrors });
      
      if (usersToProcess.length > 0) {
        setNotification({
          open: true,
          message: `Found ${usersToProcess.length} users ready for migration${processingErrors.length > 0 ? ` (${processingErrors.length} not found/errors)` : ''}.`,
          severity: 'success'
        });
      }
      
      if (usersToProcess.length === 0 && processingErrors.length === 0) {
        setNotification({
          open: true,
          message: 'No users found for the provided emails, phone numbers, or user IDs.',
          severity: 'error'
        });
      } else {
        setCurrentStep('results');
      }
    } catch (err: any) {
      setNotification({
        open: true,
        message: err.message || 'Failed to fetch users.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const { handleAction: handleMigrate } = useActionInterceptor({
    actionType: 'MIGRATE_USERS_BULK',
    onComplete: async (interceptPayload) => {
      setLoading(true);
      const finalResults: { success: UserProfile[]; failure: MigrationFailure[] } = {
        success: migrationResult.success,
        failure: migrationResult.failure,
      };

      if (usersToMigrate.length > 0) {
        try {
          const requestPayload = {
            payload: {
              request: usersToMigrate.map(user => ({
                userId: user.identifier || user.userId,
                channel: (user as any).targetChannel
              })),
              migrationOptions: {
                forceMigration: migrationOptions.forceMigration,
                softDeleteOldOrg: migrationOptions.softDeleteOldOrg,
                notifyMigration: migrationOptions.notifyMigration
              }
            },
            jiraLink: interceptPayload.jiraLink,
            changedFields: { 'channel': { 'new': 'bulk_migration', 'original': 'various' } },
            module: moduleState?.name || 'Migrate users',
            userId: user?.userId,
          };
          
          console.log('Migration Payload:', requestPayload);
          const response = await usersService.migrateBulkUser(requestPayload);
          
          // Process the bulk response
          if (response.results?.success && response.results.success.length > 0) {
            finalResults.success.push(...usersToMigrate.filter(user => 
              response.results.success.some((successResult: any) => 
                successResult.result?.userId === (user.identifier || user.userId) ||
                successResult.userId === (user.identifier || user.userId)
              )
            ));
          }
          
          if (response.results?.failure && response.results.failure.length > 0) {
            response.results.failure.forEach((failureResult: any) => {
              const user = usersToMigrate.find(u => (u.identifier || u.userId) === failureResult.userId);
              finalResults.failure.push({
                email: user?.profileDetails?.personalDetails?.primaryEmail,
                phone: user?.profileDetails?.personalDetails?.mobile,
                channel: (user as any)?.targetChannel,
                reason: failureResult.error || 'Migration failed'
              });
            });
          }
        } catch (e: any) {
          // If bulk operation fails, add all users to failure list
          usersToMigrate.forEach(user => {
            finalResults.failure.push({ 
              email: user.profileDetails?.personalDetails?.primaryEmail, 
              phone: user.profileDetails?.personalDetails?.mobile, 
              channel: (user as any).targetChannel,
              reason: e.message || 'Bulk migration failed' 
            });
          });
        }
      }
      
      setMigrationResult(finalResults);
      
      // Show success notification
      const totalUsers = finalResults.success.length + finalResults.failure.length;
      if (finalResults.success.length > 0) {
        const successMessage = totalUsers === finalResults.success.length 
          ? `Successfully migrated all ${finalResults.success.length} users!`
          : `Migration completed: ${finalResults.success.length} successful, ${finalResults.failure.length} failed out of ${totalUsers} users.`;
          
        setNotification({
          open: true,
          message: successMessage,
          severity: finalResults.failure.length === 0 ? 'success' : 'info'
        });
      } else if (finalResults.failure.length > 0) {
        setNotification({
          open: true,
          message: `Migration failed for all ${finalResults.failure.length} users. Please check the errors and try again.`,
          severity: 'error'
        });
      }
      
      setCurrentStep('results');
      setLoading(false);
    },
    getPayload: () => ({ count: usersToMigrate.length }),
  });

  const reset = () => {
    setCsvData([]);
    setUsersToMigrate([]);
    setLoading(false);
    setError(null);
    setFile(null);
    setCurrentStep('upload');
    setMigrationResult({ success: [], failure: [] });
  };

  const handleDownloadErrors = () => {
    const csvContent = Papa.unparse(migrationResult.failure);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'migration_errors.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSuccess = () => {
    const successData = migrationResult.success.map(user => ({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.profileDetails?.personalDetails?.primaryEmail || user.email || '',
      phone: user.profileDetails?.personalDetails?.mobile || user.phone || '',
      fromChannel: user.channel || '',
      toChannel: (user as any).targetChannel || '',
      status: 'Successfully Migrated',
      migrationDate: new Date().toISOString().split('T')[0]
    }));
    
    const csvContent = Papa.unparse(successData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'migration_success_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Bulk Migrate Users</Typography>
        <Button 
          variant="outlined" 
          startIcon={<UpgradeIcon />} 
          onClick={() => navigate('/bulk-upload/migrate-users-v2', { state: moduleState })}
          color="primary"
        >
          Upgrade to V2 (Large Files)
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Current Version:</strong> Supports up to 50 users at a time. 
          For larger datasets (1,000+ users), please use the <strong>V2 version</strong> with chunk-based processing.
        </Typography>
      </Alert>
      
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {currentStep === 'upload' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Download Sample CSV</Typography>
              <Typography variant="body2" color="text.secondary">
                Keep the row of the items you wish to process.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Delete the entire row you do not intend to process.
              </Typography>
              <Button variant="outlined" href={sampleCsv} download="migrate-users.csv" startIcon={<DownloadIcon />}>
                Download Sample
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>1. Upload CSV</Typography>
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={() => setIsDragging(false)}
                sx={{
                  border: '2px dashed',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: isDragging ? 'primary.main' : 'grey.400',
                  borderRadius: 1,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? 'action.hover' : 'transparent',
                  transition: 'background-color 0.2s, border-color 0.2s',
                }}
                component="label"
              >
                <input type="file" accept=".csv" onChange={handleFileChange} hidden />
                <Typography>Browse files</Typography>
                <Typography variant="body2" color="text.secondary">or</Typography>
                <Typography>Drag file to upload</Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>Max file size: 400 MB</Typography>
              </Box>
              {file && <Typography sx={{ mt: 2, fontStyle: 'italic' }}>Selected file: {file.name}</Typography>}
              <Button variant="contained" onClick={handleFetchUsers} disabled={csvData.length === 0 || loading} sx={{ mt: 2, width: '100%' }}>
                Fetch Users
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {currentStep === 'results' && (
        <Paper sx={{ p: 2 }}>
          {migrationResult.success.length > 0 ? (
            <>
              <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                🎉 Migration Completed Successfully!
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>{migrationResult.success.length}</strong> user(s) have been successfully migrated.
                  {migrationResult.failure.length > 0 && (
                    <span> However, <strong>{migrationResult.failure.length}</strong> user(s) failed to migrate.</span>
                  )}
                </Typography>
              </Alert>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={resultTab} onChange={(_, newValue) => setResultTab(newValue)}>
                  <Tab label={`Success (${migrationResult.success.length})`} />
                  <Tab label={`Failure (${migrationResult.failure.length})`} />
                </Tabs>
              </Box>
              <TabPanel value={resultTab} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" color="success.main">Successfully Migrated Users</Typography>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadSuccess} color="success">
                    Download Success Report
                  </Button>
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>First Name</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>From Channel</TableCell>
                        <TableCell>To Channel</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {migrationResult.success.map((user, i) => (
                        <TableRow key={user.userId || i}>
                          <TableCell>{user.firstName || '-'}</TableCell>
                          <TableCell>{user.lastName || '-'}</TableCell>
                          <TableCell>{user.profileDetails?.personalDetails?.primaryEmail || user.email || '-'}</TableCell>
                          <TableCell>{user.profileDetails?.personalDetails?.mobile || user.phone || '-'}</TableCell>
                          <TableCell>{user.channel || '-'}</TableCell>
                          <TableCell>{(user as any).targetChannel || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              <TabPanel value={resultTab} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="error.main">Failed to Migrate</Typography>
                  {migrationResult.failure.length > 0 && (
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadErrors}>
                      Download Errors
                    </Button>
                  )}
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>User ID</TableCell>
                        <TableCell>Target Channel</TableCell>
                        <TableCell>Reason for Failure</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {migrationResult.failure.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.email || '-'}</TableCell>
                          <TableCell>{item.phone || '-'}</TableCell>
                          <TableCell>{item.userId || '-'}</TableCell>
                          <TableCell>{item.channel || '-'}</TableCell>
                          <TableCell>{item.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              {/* Summary Section */}
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>Migration Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'success.contrastText' }}>
                      <Typography variant="h4" align="center">{migrationResult.success.length}</Typography>
                      <Typography variant="body2" align="center">Successful Migrations</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, backgroundColor: 'error.light', color: 'error.contrastText' }}>
                      <Typography variant="h4" align="center">{migrationResult.failure.length}</Typography>
                      <Typography variant="body2" align="center">Failed Migrations</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
                      <Typography variant="h4" align="center">{migrationResult.success.length + migrationResult.failure.length}</Typography>
                      <Typography variant="body2" align="center">Total Processed</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={reset} variant="outlined">Start New Migration</Button>
                <Box>
                  {migrationResult.success.length > 0 && (
                    <Button 
                      variant="contained" 
                      startIcon={<DownloadIcon />} 
                      onClick={handleDownloadSuccess}
                      color="success"
                      sx={{ mr: 1 }}
                    >
                      Download Success Report
                    </Button>
                  )}
                  {migrationResult.failure.length > 0 && (
                    <Button 
                      variant="outlined" 
                      startIcon={<DownloadIcon />} 
                      onClick={handleDownloadErrors}
                      color="error"
                    >
                      Download Error Report
                    </Button>
                  )}
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h6">2. Confirm & Migrate</Typography>
              
              {/* Migration Options */}
              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>Migration Options:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Force Migration</InputLabel>
                      <Select
                        value={migrationOptions.forceMigration.toString()}
                        label="Force Migration"
                        onChange={(e) => setMigrationOptions(prev => ({ ...prev, forceMigration: e.target.value === 'true' }))}
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                      <FormHelperText>Overwrite existing data if conflicts occur</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Soft Delete from Old Org</InputLabel>
                      <Select
                        value={migrationOptions.softDeleteOldOrg.toString()}
                        label="Soft Delete from Old Org"
                        onChange={(e) => setMigrationOptions(prev => ({ ...prev, softDeleteOldOrg: e.target.value === 'true' }))}
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                      <FormHelperText>Preserves data but removes user from old org</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Notify Users</InputLabel>
                      <Select
                        value={migrationOptions.notifyMigration.toString()}
                        label="Notify Users"
                        onChange={(e) => setMigrationOptions(prev => ({ ...prev, notifyMigration: e.target.value === 'true' }))}
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                      <FormHelperText>Send migration notification to users</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={resultTab} onChange={(_, newValue) => setResultTab(newValue)}>
                  <Tab label={`Ready for Migration (${usersToMigrate.length})`} />
                  <Tab label={`Validation Errors (${migrationResult.failure.length})`} />
                </Tabs>
              </Box>
              <TabPanel value={resultTab} index={0}>
                <Typography variant="subtitle1">The following users will be migrated.</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>First Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>User ID</TableCell>
                        <TableCell>Current Channel</TableCell>
                        <TableCell>Target Channel</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usersToMigrate.map(user => (
                        <TableRow key={user.userId}>
                          <TableCell>{user.firstName}</TableCell>
                          <TableCell>{user.profileDetails.personalDetails.primaryEmail}</TableCell>
                          <TableCell>{user.userId}</TableCell>
                          <TableCell>{user.channel}</TableCell>
                          <TableCell>{(user as any).targetChannel}</TableCell>
                          <TableCell>
                            <Chip label={user.status === 1 ? 'Active' : 'Inactive'} color={user.status === 1 ? 'success' : 'default'} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={reset} disabled={loading}>Back</Button>
                  <Button variant="contained" color="primary" onClick={handleMigrate} disabled={loading || usersToMigrate.length === 0} sx={{ ml: 2 }}>
                    Migrate {usersToMigrate.length} Users
                  </Button>
                </Box>
              </TabPanel>
              <TabPanel value={resultTab} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="error.main">Validation Errors</Typography>
                  {migrationResult.failure.length > 0 && (
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadErrors}>
                      Download Errors
                    </Button>
                  )}
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>User ID</TableCell>
                        <TableCell>Target Channel</TableCell>
                        <TableCell>Reason for Failure</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {migrationResult.failure.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.email || '-'}</TableCell>
                          <TableCell>{item.phone || '-'}</TableCell>
                          <TableCell>{item.userId || '-'}</TableCell>
                          <TableCell>{item.channel || '-'}</TableCell>
                          <TableCell>{item.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={reset} disabled={loading}>Back</Button>
                </Box>
              </TabPanel>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};
