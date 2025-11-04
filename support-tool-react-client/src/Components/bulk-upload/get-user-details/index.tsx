import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  ListItemButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Cached as CachedIcon,
} from '@mui/icons-material';
import Papa, { ParseResult } from 'papaparse';
import { usersService } from '../../../services/users.service';
import { UserProfile } from '../../../types/users';
import { getNestedValue } from '../../../utils/pathResolver';
import sampleCsv from '../../../assets/sample-files/get_user_details_sample.csv';

const CHUNK_SIZE = 200;

const SELECTABLE_FIELDS = [
  { label: 'User ID', path: 'userId', selected: true },
  { label: 'First Name', path: 'firstName', selected: true },
  { label: 'Last Name', path: 'lastName', selected: false },
  { label: 'Email', path: 'profileDetails.personalDetails.primaryEmail', selected: true },
  { label: 'Phone', path: 'profileDetails.personalDetails.mobile', selected: true },
  { label: 'Root Org Name', path: 'rootOrgName', selected: true },
  { label: 'Root Org ID', path: 'rootOrgId', selected: false },
  { label: 'Channel', path: 'channel', selected: false },
  { label: 'Status (Active/Inactive)', path: 'status', selected: true },
  { label: 'Roles', path: 'roles', selected: false },
  { label: 'Designation', path: 'profileDetails.professionalDetails[0].designation', selected: false },
  { label: 'Group', path: 'profileDetails.professionalDetails[0].group', selected: false },
  { label: 'eHRMS ID', path: 'profileDetails.additionalProperties.externalSystemId', selected: false },
  { label: 'Created Date', path: 'createdDate', selected: false },
  { label: 'Last Login Time', path: 'lastLoginTime', selected: false },
];

interface CsvRow {
  [key: string]: string;
}

export const GetUserDetails = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState<{ message: string; severity: 'error' | 'success' } | null>(null);

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [identifierColumn, setIdentifierColumn] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone' | 'userId'>('email');
  const [selectedFields, setSelectedFields] = useState(SELECTABLE_FIELDS);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fetchedUsers, setFetchedUsers] = useState<any[]>([]);
  const [notFound, setNotFound] = useState<string[]>([]);

  const processFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.toLowerCase().endsWith('.csv')) {
      setNotification({ message: 'Invalid file type. Please upload a CSV file.', severity: 'error' });
      return;
    }

    setFile(selectedFile);
    setNotification(null);

    Papa.parse<CsvRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<CsvRow>) => {
        if (results.errors.length > 0) {
          setNotification({ message: `Error parsing CSV: ${results.errors[0].message}`, severity: 'error' });
          return;
        }
        if (results.data.length === 0) {
          setNotification({ message: 'CSV file is empty or has no data rows.', severity: 'error' });
          return;
        }
        setCsvHeaders(results.meta.fields || []);
        setCsvData(results.data);
        setIdentifierColumn(results.meta.fields?.[0] || '');
        setCurrentStep(1);
        setNotification({ message: `Successfully loaded ${results.data.length} records.`, severity: 'success' });
      },
    });
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

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => event.preventDefault(), []);
  const handleDragEnter = useCallback(() => setIsDragging(true), []);

  const handleFieldToggle = (path: string) => {
    setSelectedFields(prevFields =>
      prevFields.map(field =>
        field.path === path ? { ...field, selected: !field.selected } : field
      )
    );
  };

  const startProcessing = async () => {
    if (!identifierColumn) {
      setNotification({ message: 'Please select an identifier column.', severity: 'error' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStep(2);
    setFetchedUsers([]);
    setNotFound([]);

    const identifiers = csvData
      .map(row => {
        const value = row[identifierColumn];
        // Convert to lowercase if the identifier is an email
        if (identifierType === 'email' && typeof value === 'string') {
          return value.toLowerCase();
        }
        return value;
      })
      .filter(Boolean);
    const totalIdentifiers = identifiers.length;
    const allFetchedUsers: any[] = [];
    const allNotFound: string[] = [];

    for (let i = 0; i < totalIdentifiers; i += CHUNK_SIZE) {
      const chunk = identifiers.slice(i, i + CHUNK_SIZE);
      
      try {
        const response = await usersService.getUsers({
          request: {
            filters: { [identifierType]: chunk },
            fields: ['userId', 'firstName', 'lastName', 'email', 'phone', 'rootOrgId', 'rootOrgName', 'channel', 'roles', 'profileDetails', 'status', 'createdDate', 'lastLoginTime'],
            limit: CHUNK_SIZE,
          },
        });

        const foundUsers = response.result.response.content;
        allFetchedUsers.push(...foundUsers);

        const foundIdentifiers = new Set(foundUsers.map((user: UserProfile) => {
          if (identifierType === 'email') return user.profileDetails?.personalDetails?.primaryEmail?.toLowerCase();
          if (identifierType === 'phone') return user.profileDetails?.personalDetails?.mobile;
          return user.userId;
        }));

        chunk.forEach(id => {
          // When comparing, ensure the CSV identifier is also lowercased if it's an email.
          const comparisonId = identifierType === 'email' && typeof id === 'string'
            ? id.toLowerCase()
            : id;
          if (!foundIdentifiers.has(comparisonId)) {
            allNotFound.push(id);
          }
        });

      } catch (error) {
        console.error('Error fetching user chunk:', error);
        allNotFound.push(...chunk); // Assume all failed if API call fails
      }

      setProgress(Math.round(((i + chunk.length) / totalIdentifiers) * 100));
    }

    setFetchedUsers(allFetchedUsers);
    setNotFound(allNotFound);
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const handleDownloadResults = () => {
    const activeFields = selectedFields.filter(f => f.selected);
    const headers = activeFields.map(f => f.label);
    
    const data = fetchedUsers.map(user => {
      const row: { [key: string]: any } = {};
      activeFields.forEach(field => {
        let value = getNestedValue(user, field.path);
        if (field.path === 'status') {
          value = value === 1 ? 'Active' : 'Inactive';
        }
        if (Array.isArray(value)) {
          value = value.join(', ');
        }
        row[field.label] = value ?? 'N/A';
      });
      return row;
    });

    const csvContent = Papa.unparse({
      fields: headers,
      data: data,
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'user_details_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setCurrentStep(0);
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setIdentifierColumn('');
    setIdentifierType('email');
    setSelectedFields(SELECTABLE_FIELDS);
    setFetchedUsers([]);
    setNotFound([]);
    setNotification(null);
  };

  const renderUploadStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Download Sample CSV</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download and use the sample CSV as a template for your user list.
          </Typography>
          <Button variant="outlined" startIcon={<DownloadIcon />} href={sampleCsv} download="get_user_details_sample.csv">
            Download Sample
          </Button>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>1. Upload User List</Typography>
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
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography>Browse files</Typography>
            <Typography variant="body2" color="text.secondary">or</Typography>
            <Typography>Drag file to upload</Typography>
            {file && <Typography sx={{ mt: 2, fontStyle: 'italic', color: 'success.main' }}>Selected: {file.name}</Typography>}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderConfigStep = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>2. Configure Report</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Select Identifier</Typography>
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>Identifier Column in CSV</InputLabel>
            <Select value={identifierColumn} label="Identifier Column in CSV" onChange={e => setIdentifierColumn(e.target.value)}>
              {csvHeaders.map(header => <MenuItem key={header} value={header}>{header}</MenuItem>)}
            </Select>
            <FormHelperText>Select the column containing the user identifiers.</FormHelperText>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Type of Identifier</InputLabel>
            <Select value={identifierType} label="Type of Identifier" onChange={e => setIdentifierType(e.target.value as any)}>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="phone">Phone Number</MenuItem>
              <MenuItem value="userId">User ID</MenuItem>
            </Select>
            <FormHelperText>Specify what kind of data is in the selected column.</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Select Fields to Export</Typography>
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
            <List dense>
              {selectedFields.map(field => (
                <ListItem key={field.path} disablePadding>
                  <ListItemButton onClick={() => handleFieldToggle(field.path)} dense>
                    <Checkbox edge="start" checked={field.selected} tabIndex={-1} disableRipple />
                    <ListItemText primary={field.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={() => setCurrentStep(0)} sx={{ mr: 2 }}>Back</Button>
        <Button variant="contained" startIcon={<PlayIcon />} onClick={startProcessing}>Get Details</Button>
      </Box>
    </Paper>
  );

  const renderProcessingStep = () => (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>3. Fetching User Details</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${progress}%`}</Typography>
        </Box>
      </Box>
      <Typography>Processing {csvData.length} records in chunks of {CHUNK_SIZE}. Please wait...</Typography>
    </Paper>
  );

  const renderResultsStep = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>4. Results</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">{fetchedUsers.length}</Typography>
              <Typography color="text.secondary">Users Found</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">{notFound.length}</Typography>
              <Typography color="text.secondary">Users Not Found</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {fetchedUsers.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom>Preview of Fetched Data (first 10 rows)</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {selectedFields.filter(f => f.selected).map(f => <TableCell key={f.path}>{f.label}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {fetchedUsers.slice(0, 10).map((user, index) => (
                  <TableRow key={user.userId || index}>
                    {selectedFields.filter(f => f.selected).map(field => {
                      let value = getNestedValue(user, field.path);
                      if (field.path === 'status') value = value === 1 ? 'Active' : 'Inactive';
                      if (Array.isArray(value)) value = value.join(', ');
                      return <TableCell key={field.path}>{value ?? 'N/A'}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {notFound.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" color="error.main" gutterBottom>Identifiers Not Found</Typography>
          <Paper variant="outlined" sx={{ p: 1, maxHeight: 150, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {notFound.map((id, i) => <Chip key={i} label={id} size="small" />)}
          </Paper>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" startIcon={<CachedIcon />} onClick={reset}>Start Over</Button>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadResults} disabled={fetchedUsers.length === 0}>
          Download Full Report
        </Button>
      </Box>
    </Paper>
  );

  const steps = ['Upload File', 'Configure Report', 'Processing', 'Download Results'];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderUploadStep();
      case 1: return renderConfigStep();
      case 2: return renderProcessingStep();
      case 3: return renderResultsStep();
      default: return renderUploadStep();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Get Bulk User Details</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a CSV with user identifiers to fetch and export their profile details.
      </Typography>

      {notification && (
        <Alert severity={notification.severity} sx={{ mb: 2 }} onClose={() => setNotification(null)}>
          {notification.message}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {renderStepContent()}
    </Box>
  );
};

export default GetUserDetails;
