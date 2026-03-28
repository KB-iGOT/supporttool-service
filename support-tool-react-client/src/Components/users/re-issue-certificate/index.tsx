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
  LinearProgress,
  IconButton,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import { usersService } from '../../../services/users.service';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';
import { JsonViewerDialog } from '../../common-components/JsonViewerDialog';
import {
  StatusFilterPills,
  SearchBar,
  ContentTable,
  EventsTable,
  ReissueDialog,
  CertificateDialog
} from './components';
import {
  ContentEnrollment,
  EventEnrollment,
  TabPanelProps
} from './types';

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


interface ReissueCertificateProps {
  userIdProp?: string;
  embedded?: boolean;
  canWrite?: boolean;
}

export const ReissueCertificate: React.FC<ReissueCertificateProps> = ({ userIdProp, embedded = false, canWrite = true }) => {
  // Use useLocation to access query parameters
  const location = useLocation();
  const navigate = useNavigate();
  const moduleState = location.state;
  
  // Extract userId from props or query parameters
  const queryParams = new URLSearchParams(location.search);
  const userId: any = userIdProp || queryParams.get('userId');

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
  
  // Status filter state
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0, 1, 2]);
  
  // Pagination state
  const [contentPage, setContentPage] = useState(0);
  const [contentRowsPerPage, setContentRowsPerPage] = useState(25);
  const [eventPage, setEventPage] = useState(0);
  const [eventRowsPerPage, setEventRowsPerPage] = useState(25);

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

  // State for content details dialog
  const [contentDetailsDialogOpen, setContentDetailsDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentEnrollment | null>(null);



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
        let courses = contentResponse.result.courses;
        let externalCourses = contentResponse.result.external_courses;

        // Normalize external courses to match the structure of regular courses
        const normalizedExternalCourses = externalCourses.map((extCourse: any) => ({
          ...extCourse,
          courseName: extCourse.content?.name || 'N/A',
          courseLogoUrl: extCourse.content?.appIcon,
          contentId: extCourse.courseId,
          collectionId: extCourse.courseId,
          active: extCourse.content?.isActive,
          // Add other key mappings here if needed
        }));

        let combinedCourses = [...courses, ...normalizedExternalCourses];

        setContentEnrollments(combinedCourses);
        setFilteredContent(combinedCourses);
        let internalUserInfo = contentResponse?.result?.userCourseEnrolmentInfo || {};
        let externaUserInfo = contentResponse?.result?.userExternalCourseEnrolmentInfo || {};
        let combinedUserInfo = { internalContent: internalUserInfo, externalContent: externaUserInfo };
        setUserEnrollmentInfo(combinedUserInfo);
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

  // Filter content when search query or status filter changes
  useEffect(() => {
    if (contentEnrollments.length > 0) {
      const filtered = contentEnrollments.filter(
        item => 
          item.courseName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          selectedStatuses.includes(item.status)
      );
      setFilteredContent(filtered);
    }

    if (eventEnrollments.length > 0) {
      const filtered = eventEnrollments.filter(
        item => 
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          selectedStatuses.includes(item.status || 0)
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, selectedStatuses, contentEnrollments, eventEnrollments]);

  // Handle tab change with API call
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Data will be fetched in the useEffect that depends on tabValue
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: number) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
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

  const handleOpenContentDetailsDialog = (content: ContentEnrollment) => {
    setSelectedContent(content);
    setContentDetailsDialogOpen(true);
  };

  const handleCloseContentDetailsDialog = () => {
    setContentDetailsDialogOpen(false);
    setSelectedContent(null); // It's good practice to clear the selected item on close
  };

  return (   
    <Box sx={{ padding: embedded ? 0 : 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {!embedded && (
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={() => navigate('/users', { 
              state: { 
                ...moduleState,
                searchUserId: userId,
                searchType: 'userId',
                autoSearch: true
              } 
            })} 
            sx={{ mr: 2 }}
          >
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
      )}
      
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
        
        {/* Status Filter Pills */}
        <StatusFilterPills
          selectedStatuses={selectedStatuses}
          onStatusFilterChange={handleStatusFilterChange}
        />

        {/* Search field */}
        <SearchBar
          searchQuery={searchQuery}
          placeholder={tabValue === 0 ? "Search courses..." : "Search events..."}
          onSearchChange={handleSearchChange}
        />
        
        {/* Content Tab Panel */}
        <TabPanel value={tabValue} index={0}>
          <ContentTable
            contentEnrollments={contentEnrollments}
            filteredContent={filteredContent}
            contentPage={contentPage}
            contentRowsPerPage={contentRowsPerPage}
            error={error}
            formatDate={formatDate}
            getStatusLabel={getStatusLabel}
            handleOpenReissueDialog={handleOpenReissueDialog}
            handleOpenCertificateDialog={handleOpenCertificateDialog}
            handleContentPageChange={handleContentPageChange}
            handleOpenContentDetailsDialog={handleOpenContentDetailsDialog}
            handleContentRowsPerPageChange={handleContentRowsPerPageChange}
            canWrite={canWrite}
          />
        </TabPanel>
        
        {/* Events Tab Panel */}
        <TabPanel value={tabValue} index={1}>
          <EventsTable
            eventEnrollments={eventEnrollments}
            filteredEvents={filteredEvents}
            eventPage={eventPage}
            eventRowsPerPage={eventRowsPerPage}
            error={error}
            formatDate={formatDate}
            getStatusLabel={getStatusLabel}
            handleOpenReissueDialog={handleOpenReissueDialog}
            handleOpenCertificateDialog={handleOpenCertificateDialog}
            handleEventPageChange={handleEventPageChange}
            handleEventRowsPerPageChange={handleEventRowsPerPageChange}
            canWrite={canWrite}
          />
        </TabPanel>
      </Paper>
      
      {/* Certificate View Dialog */}
      <CertificateDialog
        open={certificateDialogOpen}
        certificateData={certificateData}
        loadingCertificate={loadingCertificate}
        certificateError={certificateError}
        downloadMenuAnchorEl={downloadMenuAnchorEl}
        isDownloadMenuOpen={isDownloadMenuOpen}
        onClose={handleCloseCertificateDialog}
        onDownloadButtonClick={handleDownloadCertificate}
        onCloseDownloadMenu={handleCloseDownloadMenu}
        onDownloadAsSVG={downloadAsSVG}
        onDownloadAsPNG={downloadAsPNG}
        onDownloadAsPDF={downloadAsPDF}
      />

      {/* Re-issue Certificate Dialog */}
      <ReissueDialog
        open={reissueDialogOpen}
        selectedEnrollment={selectedEnrollment}
        processingReissue={processingReissue}
        reissueSuccess={reissueSuccess}
        reissueError={reissueError}
        formatDate={formatDate}
        onClose={handleCloseReissueDialog}
        onReissue={() => handleCertificateIssueAction({})}
      />

      {/* User Enrollment Info Dialog */}
      {userEnrollmentInfo && (
        <JsonViewerDialog
          open={enrollmentInfoDialogOpen}
          onClose={handleCloseEnrollmentInfoDialog}
          title="User Enrollment Information"
          data={userEnrollmentInfo}
        />
      )}

      {/* Content Details Dialog */}
      <JsonViewerDialog
        open={contentDetailsDialogOpen}
        onClose={handleCloseContentDetailsDialog}
        title={`Content Details: ${selectedContent?.courseName || ''}`}
        data={selectedContent}
      />
    </Box>
  );
};