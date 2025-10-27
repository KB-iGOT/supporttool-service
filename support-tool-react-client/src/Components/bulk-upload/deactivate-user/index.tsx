
import React, { useState, useContext, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tabs,
  Grid,
  Tab,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import Papa, { ParseResult, ParseError } from 'papaparse';
import { usersService } from '../../../services/users.service';
import { UserProfile } from '../../../types/users';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';
import { useLocation } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import sampleCsv from '../../../assets/sample-files/DeactivateUser.csv';


interface CsvData {
  email: string;
  phone: string;
}

interface DeactivationFailure {
  email?: string;
  phone?: string;
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
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>
  );
}
export const DeactivateUser: React.FC = () => {
  const location = useLocation();
  const moduleState = location.state;
  const { user: currentUser } = useContext(AppContext) as appContextType;
  const [csvData, setCsvData] = useState<CsvData[]>([]);
  const [usersToDeactivate, setUsersToDeactivate] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [deactivationResult, setDeactivationResult] = useState<{ success: UserProfile[]; failure: DeactivationFailure[] }>({ success: [], failure: [] });
  const [resultTab, setResultTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (selectedFile: File | undefined) => {
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError('Invalid file type. Please upload a CSV file.');
        setFile(null);
        setCsvData([]);
        return;
      }

      const maxSize = 400 * 1024 * 1024; // 400 MB
      if (selectedFile.size > maxSize) {
        setError('File size exceeds the 400 MB limit.');
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
          return header;
        },
        complete: (results: ParseResult<CsvData>) => {
          const data = results.data.filter((row: CsvData) => row.email || row.phone);
          if (data.length === 0) {
            setError('CSV file must contain at least one row with an "email" or "phone" column.');
            return;
          }
          setCsvData(data);
          setError(null);
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
    if (csvData.length === 0) {
      setError('No valid data to process.');
      return;
    }
    setLoading(true);
    setError(null);
    setUsersToDeactivate([]);
    const usersToProcess: UserProfile[] = [];
    const processingErrors: DeactivationFailure[] = [];
  
    try {
      
      const emails = csvData.map(d => d.email).filter(Boolean) as string[];
      const phones = csvData.map(d => d.phone).filter(Boolean) as string[];
      
      const searchFields = ["userId", "email", "firstName", "lastName", "phone", "rootOrgId", "channel", "roles", "profileDetails", "createdDate", "rootOrgName", "organisations", "username","status"];
  
      const userMapByEmail = new Map<string, UserProfile>();
      const userMapByPhone = new Map<string, UserProfile>();
  
      if (emails.length > 0) {
        const emailResponse = await usersService.getUsers({ request: { filters: { email: emails }, fields: searchFields } });
        emailResponse.result.response.content.forEach((user: UserProfile) => userMapByEmail.set(user.profileDetails.personalDetails.primaryEmail.toLowerCase(), user));
      }
  
      if (phones.length > 0) {
        const phoneResponse = await usersService.getUsers({ request: { filters: { phone: phones }, fields: searchFields } });
        phoneResponse.result.response.content.forEach((user: UserProfile) => userMapByPhone.set(String(user.profileDetails.personalDetails.mobile), user));
      }
  
      const processedUserIds = new Set<string>();
  
      for (const row of csvData) {
        const email = row.email?.trim().toLowerCase();
        const phone = row.phone?.trim();
  
        if (email && phone) {
          const userByEmail = userMapByEmail.get(email);
          const userByPhone = userMapByPhone.get(phone);
          if (userByEmail && userByPhone) {
            // Condition 1: If both email and phone are provided, they must match the same user.
            if (userByEmail.userId === userByPhone.userId) {
                if (!processedUserIds.has(userByEmail.userId)) {
                    if (userByEmail.status === 0) {
                        processingErrors.push({ email, phone, reason: 'User is already inactive.' });
                        processedUserIds.add(userByEmail.userId);
                        continue;
                    }
                    usersToProcess.push(userByEmail);
                    processedUserIds.add(userByEmail.userId);
                }
            } else {
              processingErrors.push({ email, phone, reason: 'Email and phone do not belong to the same user.' });
            }
          } else if (userByEmail && !userByPhone) {
            processingErrors.push({ email, phone, reason: `User found for email, but not for phone.` });
          } else if (!userByEmail && userByPhone) {
            processingErrors.push({ email, phone, reason: `User found for phone, but not for email.` });
          } else { // Neither found
            processingErrors.push({ email, phone, reason: 'User not found for either email or phone.' });
          }
        } else if (email) {
          const user = userMapByEmail.get(email);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.status === 0) {
                processingErrors.push({ email, reason: 'User is already inactive.' });
                processedUserIds.add(user.userId);
                continue;
              }
              usersToProcess.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            processingErrors.push({ email, reason: 'User not found.' });
          }
        } else if (phone) {
          const user = userMapByPhone.get(phone);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.status === 0) {
                processingErrors.push({ phone, reason: 'User is already inactive.' });
                processedUserIds.add(user.userId);
                continue;
              }
              usersToProcess.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            processingErrors.push({ phone, reason: 'User not found.' });
          }
        }
      }
      setUsersToDeactivate(usersToProcess);
      setDeactivationResult({ success: [], failure: processingErrors });
      if (usersToProcess.length === 0 && processingErrors.length === 0) {
        setError('No users found for the provided emails and/or phone numbers.');
      } else {
        setStep('result');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const { handleAction: handleDeactivate } = useActionInterceptor({
    actionType: 'DEACTIVATE_USERS_BULK',
    onComplete: async (interceptPayload) => {
      setLoading(true);
      const finalResults: { success: UserProfile[]; failure: DeactivationFailure[] } = {
        success: deactivationResult.success, // Carry over from validation step
        failure: deactivationResult.failure,
      };

      if (usersToDeactivate.length > 0) {
          try {
              const requestPayload = {
                  payload: {
                      request: usersToDeactivate.map(user => ({
                          userId: user.userId,
                          requestedBy: currentUser?.userId,
                      })),
                  },
                  jiraLink: interceptPayload.jiraLink,
                  changedFields: { 'status': { 'new': 0, 'original': 1 } },
                  module: moduleState?.name || 'Deactivate user',
                  userId: currentUser?.userId, // Admin user's ID
              };
              console.log('Deactivation Payload:', requestPayload);
              await usersService.deactivateBulkUser(requestPayload);
              finalResults.success.push(...usersToDeactivate);
          } catch (e: any) {
              usersToDeactivate.forEach(user => {
                  finalResults.failure.push({ email: user.profileDetails?.personalDetails?.primaryEmail, phone: user.profileDetails?.personalDetails?.mobile, reason: e.message || 'Bulk deactivation failed' });
              });
          }
      }
      setDeactivationResult(finalResults);
      setStep('result');
      setLoading(false);
    },
    getPayload: () => ({ count: usersToDeactivate.length }),
  });

  const reset = () => {
    setCsvData([]);
    setUsersToDeactivate([]);
    setLoading(false);
    setError(null);
    setFile(null);
    setStep('upload');
    setDeactivationResult({ success: [], failure: [] });
  };

  const handleDownloadErrors = () => {
    const csvContent = Papa.unparse(deactivationResult.failure);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'deactivation_errors.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Bulk Deactivate Users</Typography>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {step === 'upload' && (
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
              <Button variant="outlined" href={sampleCsv} download="DeactivateUser.csv" startIcon={<DownloadIcon />}>
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

      {step === 'result' && (
        <Paper sx={{ p: 2 }}>
          {deactivationResult.success.length > 0 ? (
            <>
              <Typography variant="h6">2. Deactivation Results</Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={resultTab} onChange={(_, newValue) => setResultTab(newValue)}>
                  <Tab label={`Success (${deactivationResult.success.length})`} />
                  <Tab label={`Failure (${deactivationResult.failure.length})`} />
                </Tabs>
              </Box>
              <TabPanel value={resultTab} index={0}>
                <Typography variant="subtitle1" color="success.main">Successfully Deactivated</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>First Name</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Organisation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deactivationResult.success.map((user, i) => (
                        <TableRow key={user.userId || i}>
                          <TableCell>{user.firstName || '-'}</TableCell>
                          <TableCell>{user.lastName || '-'}</TableCell>
                          <TableCell>{user.profileDetails?.personalDetails?.primaryEmail || user.email || '-'}</TableCell>
                          <TableCell>{user.profileDetails?.personalDetails?.mobile || user.phone || '-'}</TableCell>
                          <TableCell>{user.rootOrgName || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              <TabPanel value={resultTab} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="error.main">Failed to Deactivate</Typography>
                  {deactivationResult.failure.length > 0 && (
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
                        <TableCell>Reason for Failure</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deactivationResult.failure.map((item, i) => (
                        <TableRow key={i}><TableCell>{item.email || '-'}</TableCell><TableCell>{item.phone || '-'}</TableCell><TableCell>{item.reason}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              <Button onClick={reset} sx={{ mt: 2 }}>Start Over</Button>
            </>
          ) : (
            <>
              <Typography variant="h6">2. Confirm & Deactivate</Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={resultTab} onChange={(_, newValue) => setResultTab(newValue)}>
                  <Tab label={`Ready for Deactivation (${usersToDeactivate.length})`} />
                  <Tab label={`Validation Errors (${deactivationResult.failure.length})`} />
                </Tabs>
              </Box>
              <TabPanel value={resultTab} index={0}>
                <Typography variant="subtitle1">The following users will be deactivated.</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>First Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Organisation</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usersToDeactivate.map(user => (
                        <TableRow key={user.userId}>
                          <TableCell>{user.firstName}</TableCell>
                          <TableCell>{user.profileDetails.personalDetails.primaryEmail}</TableCell>
                          <TableCell>{user.rootOrgName}</TableCell>
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
                  <Button variant="contained" color="error" onClick={handleDeactivate} disabled={loading || usersToDeactivate.length === 0} sx={{ ml: 2 }}>
                    Deactivate {usersToDeactivate.length} Users
                  </Button>
                </Box>
              </TabPanel>
              <TabPanel value={resultTab} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="error.main">Validation Errors</Typography>
                  {deactivationResult.failure.length > 0 && (
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
                        <TableCell>Reason for Failure</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deactivationResult.failure.map((item, i) => (
                        <TableRow key={i}><TableCell>{item.email || '-'}</TableCell><TableCell>{item.phone || '-'}</TableCell><TableCell>{item.reason}</TableCell></TableRow>
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