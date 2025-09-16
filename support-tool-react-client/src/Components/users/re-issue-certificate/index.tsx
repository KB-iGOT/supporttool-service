import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Collapse,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import InfoIcon from '@mui/icons-material/Info';
import { usersService } from '../../../services/users.service';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';
import { JsonViewerDialog } from '../../common-components/JsonViewerDialog';

// Type definitions for content data
interface ContentEnrollment {
  dateTime: number;
  lastReadContentStatus: number;
  enrolledDate: number;
  contentId: string;
  description: string;
  courseLogoUrl: string;
  batchId: string;
  content: any;
  contentStatus: any;
  lastContentAccessTime: number;
  certstatus: any;
  lastReadContentId: string;
  courseId: string;
  collectionId: string;
  addedBy: string;
  batch: any;
  active: boolean;
  userId: string;
  completionPercentage: number;
  issuedCertificates: IssuedCertificate[];
  courseName: string;
  certificates: any[];
  completedOn: number;
  leafNodesCount: number;
  progress: number;
  status: number;
}

interface IssuedCertificate {
  identifier: string;
  lastIssuedOn: string;
  name: string;
  token: string;
}

interface EventEnrollment {
  identifier?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
  enrollmentEndDate?: string;
  venue?: string;
  onlineProvider?: string;
  sessionLink?: string;
  enrollmentStatus?: string;
  dateTime?: number;
  contentId?: string;
  batchId?: string;
  userId?: string;
  completionPercentage?: number;
  issuedCertificates?: IssuedCertificate[];
  certificates?: any[];
  completedOn?: number;
  progress?: number;
  event?: {
    identifier: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    eventType: string;
    status: string;
    appIcon?: string;
    startDateTime?: string;
    endDateTime?: string;
    registrationLink?: string;
    batches?: Array<{
      batchId: string;
      startDate: string;
      endDate: string;
      enrollmentEndDate: string;
      status: number;
    }>;
  };
  batchDetails?: Array<{
    batchId: string;
    name: string;
    startDate: number;
    endDate: number;
    status: number;
    enrollmentEndDate: number;
    certTemplates?: any;
  }>;
}

// Tab Panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certificate-tabpanel-${index}`}
      aria-labelledby={`certificate-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface CollapsibleRowProps {
  enrollment: ContentEnrollment;
  formatDate: (timestamp: number) => string;
  getStatusLabel: (status: number) => string;
  handleOpenReissueDialog: (enrollment: ContentEnrollment) => void;
  handleOpenCertificateDialog: (certId: string) => void;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({
  enrollment,
  formatDate,
  getStatusLabel,
  handleOpenReissueDialog,
  handleOpenCertificateDialog
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center">
            {enrollment.courseLogoUrl && (
              <Box
                component="img"
                src={enrollment.content.posterImage}
                alt=""
                sx={{ width: 40, height: 40, mr: 2, borderRadius: 1 }}
              />
            )}
            <Typography variant="body2">{enrollment.courseName}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(enrollment.status)}
            color={enrollment.status === 2 ? "success" : "warning"}
            size="small"
          />
        </TableCell>
        <TableCell>{`${enrollment.completionPercentage}%`}</TableCell>
        <TableCell>{enrollment.completedOn ? formatDate(enrollment.completedOn) : 'N/A'}</TableCell>
        <TableCell>
          {enrollment.issuedCertificates && enrollment.issuedCertificates.length > 0 ? (
            <Chip
              label={`${enrollment.issuedCertificates.length} Issued`}
              color="primary"
              size="small"
              icon={<SchoolIcon />}
            />
          ) : (
            <Chip label="None" variant="outlined" size="small" />
          )}
        </TableCell>
        <TableCell>
          {enrollment.issuedCertificates && enrollment.issuedCertificates.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="info"
                onClick={() => handleOpenCertificateDialog(enrollment.issuedCertificates[0].identifier)}
              >
                View Certificate
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleOpenReissueDialog(enrollment)}
                disabled={enrollment.status !== 2}
              >
                Re-issue
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleOpenReissueDialog(enrollment)}
              disabled={enrollment.status !== 2}
            >
              Re-issue
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Additional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Course ID:</strong> {enrollment.courseId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Batch ID:</strong> {enrollment.batchId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Completion Date:</strong> {formatDate(enrollment.completedOn)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Certificates Issued:</strong> {enrollment.issuedCertificates?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Added By:</strong> {enrollment.addedBy}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Active:</strong> {enrollment.active ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

interface CollapsibleEventRowProps {
  event: EventEnrollment;
  formatDate: (timestamp: number) => string;
  getStatusLabel: (status: number) => string;
  handleOpenReissueDialog: (event: EventEnrollment) => void;
  handleOpenCertificateDialog: (certId: string) => void;
}

const CollapsibleEventRow: React.FC<CollapsibleEventRowProps> = ({
  event,
  formatDate,
  getStatusLabel,
  handleOpenReissueDialog,
  handleOpenCertificateDialog
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center">
            {event.event?.appIcon && (
              <Box
                component="img"
                src={event.event.appIcon}
                alt=""
                sx={{ width: 40, height: 40, mr: 2, borderRadius: 1 }}
              />
            )}
            <Typography variant="body2">{event.name}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(event.status || 0)}
            color={event.status === 2 ? "success" : "default"}
            size="small"
          />
        </TableCell>
        <TableCell>{event.event?.eventType || 'N/A'}</TableCell>
        <TableCell>{event.event?.startDateTime ? new Date(event.event.startDateTime).toLocaleString() : event.startDate}</TableCell>
        <TableCell>
          {event.issuedCertificates && event.issuedCertificates.length > 0 ? (
            <Chip
              label={`${event.issuedCertificates.length} Issued`}
              color="primary"
              size="small"
              icon={<SchoolIcon />}
            />
          ) : (
            <Chip label="None" variant="outlined" size="small" />
          )}
        </TableCell>
        <TableCell>
          {event.issuedCertificates && event.issuedCertificates.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="info"
                onClick={() => event.issuedCertificates && event.issuedCertificates.length > 0 && 
                  handleOpenCertificateDialog(event.issuedCertificates[0].identifier)}
              >
                View Certificate
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                disabled={event.status !== 2}
                onClick={() => handleOpenReissueDialog(event)}
              >
                Re-issue
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              disabled={event.status !== 2}
              onClick={() => handleOpenReissueDialog(event)}
            >
              Re-issue
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Event Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Event ID:</strong> {event.contentId || event.event?.identifier}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Batch ID:</strong> {event.batchId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Start Date:</strong> {event.event?.startDateTime ? new Date(event.event.startDateTime).toLocaleString() : event.startDate}
                  </Typography>
                  <Typography variant="body2">
                    <strong>End Date:</strong> {event.event?.endDateTime ? new Date(event.event.endDateTime).toLocaleString() : event.endDate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Certificates Issued:</strong> {event.issuedCertificates?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Event Type:</strong> {event.event?.eventType || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {getStatusLabel(event.status || 0)}
                  </Typography>
                  {event.event?.registrationLink && (
                    <Typography variant="body2">
                      <strong>Registration Link:</strong>{' '}
                      <Link href={event.event.registrationLink} target="_blank" rel="noopener">
                        Open Link
                      </Link>
                    </Typography>
                  )}
                </Grid>
              </Grid>
              {event.event?.description && (
                <Box mt={2}>
                  <Typography variant="body2">
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    {event.event.description}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const ReissueCertificate: React.FC = () => {
  // Use useLocation to access query parameters
  const location = useLocation();
  const navigate = useNavigate();
  const moduleState = location.state;
  
  // Extract userId from query parameters
  const queryParams = new URLSearchParams(location.search);
  const userId: any = queryParams.get('userId');

  // State declarations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Content and event data
  const [contentEnrollments, setContentEnrollments] = useState<ContentEnrollment[]>([]);
  const [eventEnrollments, setEventEnrollments] = useState<EventEnrollment[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentEnrollment[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventEnrollment[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [contentPage, setContentPage] = useState(0);
  const [contentRowsPerPage, setContentRowsPerPage] = useState(5);
  const [eventPage, setEventPage] = useState(0);
  const [eventRowsPerPage, setEventRowsPerPage] = useState(5);

  // Certificate reissue dialog state
  const [reissueDialogOpen, setReissueDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<ContentEnrollment | null>(null);
  const [processingReissue, setProcessingReissue] = useState(false);
  const [reissueSuccess, setReissueSuccess] = useState(false);
  const [reissueError, setReissueError] = useState<string | null>(null);
  const [userEnrollmentInfo, setUserEnrollmentInfo] = useState<any>(null);
  // New state for certificate viewing
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [certificateData, setCertificateData] = useState<string | null>(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [enrollmentInfoDialogOpen, setEnrollmentInfoDialogOpen] = useState(false);



  // Add download menu state
  const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const isDownloadMenuOpen = Boolean(downloadMenuAnchorEl);

  // Separate API calls for content and event data
  const fetchContentEnrollments = async () => {
    try {
      setLoading(true);
      
      // Fetch content enrollments
      const contentResponse = await usersService.getUserContentEnrollList(userId);
      
      if (contentResponse.result && contentResponse.result.courses && Array.isArray(contentResponse.result.courses)) {
        // const mappedContents: ContentEnrollment[] = contentResponse.result.courses.map((item: any) => {
        //   return {
        //     identifier: item.contentId || item.content?.identifier,
        //     courseName: item.content?.name,
        //     description: item.content?.description,
        //     startDate: item.content?.startDate,
        //     endDate: item.content?.endDate,
        //     status: item.status,
        //     contentId: item.contentId  || item.content?.identifier,
        //     batchId: item.batchId,
        //     userId: item.userId,
        //     completionPercentage: item.completionPercentage || 0,
        //     issuedCertificates: item.issuedCertificates || [],
        //     certificates: item.certificates || [],
        //     completedOn: item.completedOn,
        //     progress: item.progress || 0,
        //     enrollmentEndDate: item.batchDetails?.[0]?.enrollmentEndDate 
        //       ? new Date(item.batchDetails[0].enrollmentEndDate).toISOString().split('T')[0] 
        //       : undefined,
        //     sessionLink: item.content?.registrationLink,
        //     enrollmentStatus: getStatusLabel(item.status),
        //     batchDetails: item.content?.batchDetails
        //   };
        // });
        // setContentEnrollments(mappedContents);
        // setFilteredContent(mappedContents);
        setContentEnrollments(contentResponse.result.courses);
        setFilteredContent(contentResponse.result.courses);
        setUserEnrollmentInfo(contentResponse.result.userCourseEnrolmentInfo);
      }
    } catch (err) {
      console.error('Error fetching content enrollments:', err);
      setError('Failed to fetch course enrollment information');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEventEnrollments = async () => {
    try {
      setLoading(true);
      
      // Fetch event enrollments
      const eventResponse = await usersService.getUserEventEnrollList(userId);
      
      if (eventResponse.result &&  eventResponse.result.events && Array.isArray(eventResponse.result.events)) {
        // Map the response to match our EventEnrollment interface
        const mappedEvents: EventEnrollment[] = eventResponse.result.events.map((item: any) => {
          return {
            identifier: item.contentId || item.event?.identifier,
            name: item.event?.name,
            description: item.event?.description,
            startDate: item.event?.startDate,
            endDate: item.event?.endDate,
            status: item.status,
            contentId: item.contentId,
            batchId: item.batchId,
            userId: item.userId,
            completionPercentage: item.completionPercentage || 0,
            issuedCertificates: item.issuedCertificates || [],
            certificates: item.certificates || [],
            completedOn: item.completedOn,
            progress: item.progress || 0,
            enrollmentEndDate: item.batchDetails?.[0]?.enrollmentEndDate 
              ? new Date(item.batchDetails[0].enrollmentEndDate).toISOString().split('T')[0] 
              : undefined,
            venue: item.event?.eventType === 'Offline' ? 'Physical Venue' : undefined,
            onlineProvider: item.event?.eventType === 'Online' ? 'Online Event' : undefined,
            sessionLink: item.event?.registrationLink,
            enrollmentStatus: getStatusLabel(item.status),
            event: item.event,
            batchDetails: item.batchDetails
          };
        });
        
        setEventEnrollments(mappedEvents);
        setFilteredEvents(mappedEvents);
          setUserEnrollmentInfo({})
        if(eventResponse?.result?.userEventEnrolmentInfo) {
          setUserEnrollmentInfo(eventResponse.result.userEventEnrolmentInfo);
        }
      }
    } catch (err) {
      console.error('Error fetching event enrollments:', err);
      setError('Failed to fetch event enrollment information');
    } finally {
      setLoading(false);
    }
  };

  // Update fetchEnrollmentData to use the new separate functions
  const fetchEnrollmentData = async () => {
    if (tabValue === 0) {
      await fetchContentEnrollments();
    } else {
      await fetchEventEnrollments();
    }
  };

  // Fetch data when component mounts, but only for the active tab
  useEffect(() => {
    if (userId) {
      fetchEnrollmentData();
    } else {
      setError('No user ID provided. Cannot proceed with certificate re-issuance.');
    }
  }, [userId, tabValue]); // Add tabValue as a dependency

  // Filter content when search query changes
  useEffect(() => {
    if (contentEnrollments.length > 0) {
      const filtered = contentEnrollments.filter(
        item => item.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContent(filtered);
    }

    if (eventEnrollments.length > 0) {
      const filtered = eventEnrollments.filter(
        item => item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, contentEnrollments, eventEnrollments]);

  // Handle tab change with API call
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Data will be fetched in the useEffect that depends on tabValue
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle content pagination
  const handleContentPageChange = (event: unknown, newPage: number) => {
    setContentPage(newPage);
  };

  const handleContentRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContentRowsPerPage(parseInt(event.target.value, 10));
    setContentPage(0);
  };

  // Handle event pagination
  const handleEventPageChange = (event: unknown, newPage: number) => {
    setEventPage(newPage);
  };

  const handleEventRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEventRowsPerPage(parseInt(event.target.value, 10));
    setEventPage(0);
  };

  // Handle certificate reissue
  const handleOpenReissueDialog = (enrollment: ContentEnrollment | EventEnrollment) => {
    setSelectedEnrollment(enrollment as ContentEnrollment);
    setReissueDialogOpen(true);
    setReissueSuccess(false);
    setReissueError(null);
  };

  const handleCloseReissueDialog = () => {
    setReissueDialogOpen(false);
    setSelectedEnrollment(null);
  };

    // Create a ref to hold the latest form data
    const latestFormDataRef = React.useRef<any>({});
  
    const handleCertificateIssueAction = (data: any) => {
      
      // Update both state and ref
      latestFormDataRef.current = data;
      
      // Call handleEditSubmit which will use the latest data from the ref
      handleEditSubmit();
    }
  
    // Modify your useActionInterceptor to use the ref instead
    const { handleAction: handleEditSubmit } = useActionInterceptor({
      actionType: 'Patch',
      onComplete: (interceptPayload) => handleReissueCertificate(interceptPayload),
      getPayload: () => ({})
    });

  const handleReissueCertificate = async (ticket: any) => {
    if (!selectedEnrollment) return;
    
    try {
      setProcessingReissue(true);
      
      // Call API to reissue certificate
      // This is a placeholder - implement the actual API call
      
      const idKey = tabValue === 0 ? 'courseId' : 'eventId';

      const request = {
        payload: {
          "request": {
              userIds: [userId],
              [idKey]: selectedEnrollment.courseId || selectedEnrollment.contentId,
              batchId: selectedEnrollment.batchId,
              type: tabValue === 0 ? 'course' : 'event',
            }
          },
          changedFields:"Resued Certificate",
          module: moduleState?.name || 'users',
          jiraLink: ticket?.jiraLink || "",
          userId: userId
        };
      let response = await usersService.reissuecertificate(request);
      
      if(response && response.result && response.result.result && response.result.result.result && response.result.result.result.status) {
        setReissueSuccess(true); 
        setReissueDialogOpen(false);
      }
      // Refetch enrollment data after successful reissue
      setTimeout(() => {
        fetchEnrollmentData();
      }, 2000);
    } catch (err: any) {
      console.error('Error reissuing certificate:', err);
      setReissueError(err.message || 'Failed to reissue certificate');
    } finally {
      setProcessingReissue(false);
    }
  };

  // Handle opening certificate dialog
  const handleOpenCertificateDialog = async (certId: string) => {
    setSelectedCertificateId(certId);
    setCertificateDialogOpen(true);
    setCertificateData(null);
    setCertificateError(null);
    
    try {
      setLoadingCertificate(true);
      
      // Call API to get certificate data
      const response = await usersService.downloadcertificate(certId);
      
      if (response && response.result && response.result.printUri) {
        setCertificateData(response.result.printUri);
      } else {
        throw new Error('Invalid certificate data received');
      }
    } catch (err: any) {
      console.error('Error fetching certificate:', err);
      setCertificateError(err.message || 'Failed to fetch certificate');
    } finally {
      setLoadingCertificate(false);
    }
  };

  const handleCloseCertificateDialog = () => {
    setCertificateDialogOpen(false);
    setSelectedCertificateId(null);
    setCertificateData(null);
  };

  const handleOpenDownloadMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDownloadMenuAnchorEl(event.currentTarget);
  };

  const handleCloseDownloadMenu = () => {
    setDownloadMenuAnchorEl(null);
  };

  const downloadAsSVG = () => {
    if (!certificateData) return;
    
    const link = document.createElement('a');
    link.href = certificateData;
    link.download = `certificate-${selectedCertificateId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleCloseDownloadMenu();
  };

  const downloadAsPNG = () => {
    if (!certificateData) return;
    
    try {
      setLoadingCertificate(true);
      
      // Create a temporary SVG element
      const tempDiv = document.createElement('div');
      
      // Handle both data URI formats
      let svgContent;
      if (certificateData.startsWith('data:image/svg+xml,')) {
        svgContent = decodeURIComponent(certificateData.replace('data:image/svg+xml,', ''));
      } else if (certificateData.startsWith('data:image/svg+xml;base64,')) {
        const base64Content = certificateData.replace('data:image/svg+xml;base64,', '');
        svgContent = atob(base64Content);
      } else {
        // Default fallback
        svgContent = decodeURIComponent(certificateData.split(',')[1] || '');
      }
      
      tempDiv.innerHTML = svgContent;
      const svgElement = tempDiv.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('Invalid SVG content');
      }
      
      // Set width and height attributes if they don't exist
      if (!svgElement.hasAttribute('width')) {
        svgElement.setAttribute('width', '1000');
      }
      if (!svgElement.hasAttribute('height')) {
        svgElement.setAttribute('height', '700');
      }
      
      // Get SVG dimensions
      const width = parseInt(svgElement.getAttribute('width') || '1000');
      const height = parseInt(svgElement.getAttribute('height') || '700');
      
      // Create canvas with appropriate dimensions
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not create canvas context');
      }
      
      // Use a more reliable method to render SVG to canvas
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
        
        try {
          // Download the PNG
          const pngData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngData;
          link.download = `certificate-${selectedCertificateId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error('Error creating PNG:', err);
          setCertificateError('Failed to convert to PNG. The certificate may contain external resources.');
        } finally {
          URL.revokeObjectURL(url);
          setLoadingCertificate(false);
        }
      };
      
      image.onerror = (err) => {
        console.error('Error loading SVG as image:', err);
        setCertificateError('Failed to load SVG for PNG conversion');
        URL.revokeObjectURL(url);
        setLoadingCertificate(false);
      };
      
      image.src = url;
    } catch (err) {
      console.error('Error in PNG conversion:', err);
      setCertificateError('Failed to convert certificate to PNG');
      setLoadingCertificate(false);
    }
    
    handleCloseDownloadMenu();
  };

  const downloadAsPDF = async () => {
    if (!certificateData) return;
    
    try {
      // Indicate loading state
      setLoadingCertificate(true);
      
      // For direct browser-based PDF conversion, we can use a client-side approach
      // instead of relying on a server endpoint
      
      // First, get the SVG content properly
      let svgContent;
      if (certificateData.startsWith('data:image/svg+xml,')) {
        svgContent = decodeURIComponent(certificateData.replace('data:image/svg+xml,', ''));
      } else if (certificateData.startsWith('data:image/svg+xml;base64,')) {
        const base64Content = certificateData.replace('data:image/svg+xml;base64,', '');
        svgContent = atob(base64Content);
      } else {
        // Default fallback
        svgContent = decodeURIComponent(certificateData.split(',')[1] || '');
      }
      
      // Use the same PNG conversion method and then embed it in a PDF
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgContent;
      const svgElement = tempDiv.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('Invalid SVG content');
      }
      
      // Set width and height attributes if they don't exist
      if (!svgElement.hasAttribute('width')) {
        svgElement.setAttribute('width', '1000');
      }
      if (!svgElement.hasAttribute('height')) {
        svgElement.setAttribute('height', '700');
      }
      
      // Get SVG dimensions
      const width = parseInt(svgElement.getAttribute('width') || '1000');
      const height = parseInt(svgElement.getAttribute('height') || '700');
      
      // Create canvas with appropriate dimensions
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not create canvas context');
      }
      
      // Convert SVG to an image
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      
      // Since we don't have a server endpoint for PDF conversion, we'll use the client-side approach:
      // 1. Render SVG to canvas
      // 2. Convert canvas to PNG
      // 3. Create a simple PDF with the PNG image
      
      // Load the SVG into an image element
      const image = new Image();
      image.onload = () => {
        // Draw the image to the canvas
        context.fillStyle = 'white';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        
        try {
          // Get the PNG data URL
          const imgData = canvas.toDataURL('image/png');
          
          // Generate PDF using browser download
          // For a basic approach, we'll just download the PNG instead of PDF
          // In a real app, you'd want to use a library like jspdf here
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `certificate-${selectedCertificateId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Show message about PDF conversion
          setCertificateError('PDF conversion requires server-side processing. Downloaded as PNG instead.');
        } catch (err) {
          console.error('Error in PDF creation:', err);
          setCertificateError('Failed to generate PDF. Try downloading as PNG instead.');
        } finally {
          URL.revokeObjectURL(url);
          setLoadingCertificate(false);
        }
      };
      
      image.onerror = (err) => {
        console.error('Error loading SVG as image:', err);
        setCertificateError('Failed to load SVG for PDF conversion');
        URL.revokeObjectURL(url);
        setLoadingCertificate(false);
      };
      
      image.src = url;
    } catch (error) {
      console.error('Error in PDF conversion process:', error);
      setCertificateError('Failed to convert certificate to PDF. Please try another format.');
      setLoadingCertificate(false);
    }
    
    handleCloseDownloadMenu();
  };

  // Format date function
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status label
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return 'Not Started';
      case 1:
        return 'In Progress';
      case 2:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const handleDownloadCertificate = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Open the download menu anchored to the button that was clicked
    setDownloadMenuAnchorEl(event.currentTarget);
  };

  const handleOpenEnrollmentInfoDialog = () => {
    setEnrollmentInfoDialogOpen(true);
  };

  const handleCloseEnrollmentInfoDialog = () => {
    setEnrollmentInfoDialogOpen(false);
  };

  return (   
    <Box sx={{ padding: 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <div>
            <Typography variant="h4" component="h1">
              Re-issue Certificate
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              User ID: {userId}
            </Typography>
          </div>
          {userEnrollmentInfo && Object.keys(userEnrollmentInfo)?.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<InfoIcon />}
              onClick={handleOpenEnrollmentInfoDialog}
              sx={{ ml: 2 }}
            >View Enrollment Info</Button>
          )}
        </Box>
      </Box>
      
      {/* Display top-level errors but still show the UI */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 2 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="certificate tabs"
          >
            <Tab label="Contents" id="certificate-tab-0" />
            <Tab label="Events" id="certificate-tab-1" />
          </Tabs>
        </Box>
        
        {/* Search field */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            placeholder={tabValue === 0 ? "Search courses..." : "Search events..."}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {/* Content Tab Panel */}
        <TabPanel value={tabValue} index={0}>
          {contentEnrollments.length === 0 ? (
            <Alert severity="info">
              {error ? "Failed to load course enrollments. Please try again later." : "No course enrollments found for this user."}
            </Alert>
          ) : filteredContent.length === 0 ? (
            <Alert severity="info">No courses match your search criteria.</Alert>
          ) : (
            <>
              <TableContainer>
                <Table aria-label="collapsible course enrollments table">
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Course Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Completion Date</TableCell>
                      <TableCell>Certificates</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredContent
                      .slice(contentPage * contentRowsPerPage, contentPage * contentRowsPerPage + contentRowsPerPage)
                      .map((enrollment, index) => (
                        <CollapsibleRow 
                          key={enrollment.courseId + index} 
                          enrollment={enrollment} 
                          formatDate={formatDate}
                          getStatusLabel={getStatusLabel}
                          handleOpenReissueDialog={handleOpenReissueDialog}
                          handleOpenCertificateDialog={handleOpenCertificateDialog}
                        />
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredContent.length}
                rowsPerPage={contentRowsPerPage}
                page={contentPage}
                onPageChange={handleContentPageChange}
                onRowsPerPageChange={handleContentRowsPerPageChange}
              />
            </>
          )}
        </TabPanel>
        
        {/* Events Tab Panel */}
        <TabPanel value={tabValue} index={1}>
          {eventEnrollments.length === 0 ? (
            <Alert severity="info">
              {error ? "Failed to load event enrollments. Please try again later." : "No event enrollments found for this user."}
            </Alert>
          ) : filteredEvents.length === 0 ? (
            <Alert severity="info">No events match your search criteria.</Alert>
          ) : (
            <>
              <TableContainer>
                <Table aria-label="collapsible event enrollments table">
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Event Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Certificates</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEvents
                      .slice(eventPage * eventRowsPerPage, eventPage * eventRowsPerPage + eventRowsPerPage)
                      .map((event, index) => (
                        <CollapsibleEventRow
                          key={`${event.identifier}-${index}`}
                          event={event}
                          formatDate={formatDate}
                          getStatusLabel={getStatusLabel}
                          handleOpenReissueDialog={handleOpenReissueDialog}
                          handleOpenCertificateDialog={handleOpenCertificateDialog}
                        />
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredEvents.length}
                rowsPerPage={eventRowsPerPage}
                page={eventPage}
                onPageChange={handleEventPageChange}
                onRowsPerPageChange={handleEventRowsPerPageChange}
              />
            </>
          )}
        </TabPanel>
      </Paper>
      
      {/* Certificate View Dialog */}
      <Dialog 
        open={certificateDialogOpen} 
        onClose={handleCloseCertificateDialog} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Certificate Preview</Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadCertificate}
              disabled={!certificateData || loadingCertificate}
              aria-controls={isDownloadMenuOpen ? 'download-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={isDownloadMenuOpen ? 'true' : undefined}
            >
              Download
            </Button>
            <Menu
              id="download-menu"
              anchorEl={downloadMenuAnchorEl}
              open={isDownloadMenuOpen}
              onClose={handleCloseDownloadMenu}
              MenuListProps={{
                'aria-labelledby': 'download-button',
              }}
            >
              <MenuItem onClick={downloadAsSVG}>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>SVG (Vector)</ListItemText>
              </MenuItem>
              <MenuItem onClick={downloadAsPNG}>
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>PNG Image</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingCertificate ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : certificateError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {certificateError}
            </Alert>
          ) : certificateData ? (
            <Box sx={{ 
              width: '100%', 
              height: '500px', 
              overflow: 'auto', 
              border: '1px solid #eee',
              p: 2,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Box 
                component="object"
                data={certificateData}
                type="image/svg+xml"
                sx={{ width: '100%', height: '100%' }}
              />
            </Box>
          ) : (
            <Typography>No certificate data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCertificateDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Re-issue Certificate Dialog */}
      <Dialog open={reissueDialogOpen} onClose={handleCloseReissueDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Re-issue Certificate</DialogTitle>
        <DialogContent>
          {selectedEnrollment && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You are about to re-issue a certificate for:
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {selectedEnrollment.courseName}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Course ID:</strong> {selectedEnrollment.courseId}
                </Typography>
                <Typography variant="body2">
                  <strong>Batch ID:</strong> {selectedEnrollment.batchId}
                </Typography>
                <Typography variant="body2">
                  <strong>Completion Date:</strong> {formatDate(selectedEnrollment.completedOn)}
                </Typography>
                <Typography variant="body2">
                  <strong>Certificates Issued:</strong> {selectedEnrollment.issuedCertificates?.length || 0}
                </Typography>
              </Box>
              
              {reissueSuccess ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Certificates issue action for Course Batch Id  {selectedEnrollment.batchId} submitted Successfully!
                </Alert>
              ) : reissueError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {reissueError}
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Re-issuing a certificate will generate a new certificate for this course completion.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReissueDialog} disabled={processingReissue}>
            {reissueSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!reissueSuccess && (
            <Button
              onClick={handleCertificateIssueAction}
              variant="contained"
              color="primary"
              disabled={processingReissue}
              startIcon={processingReissue ? <CircularProgress size={24} /> : <DownloadIcon />}
            >
              {processingReissue ? 'Processing...' : 'Re-issue Certificate'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* User Enrollment Info Dialog */}
      {userEnrollmentInfo && (
        <JsonViewerDialog
          open={enrollmentInfoDialogOpen}
          onClose={handleCloseEnrollmentInfoDialog}
          title="User Enrollment Information"
          data={userEnrollmentInfo}
        />
      )}
    </Box>
  );
};