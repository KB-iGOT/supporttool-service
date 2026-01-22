import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    LinearProgress,
    Alert,
    TextField,
    InputAdornment,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Tooltip,
    Grid,
    Collapse,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { usersService } from '../../services/users.service';
import { useActionInterceptor } from '../../hooks/useActionInterceptor';

interface CertificatesViewProps {
    ticketDetails?: any;
    userId?: string;
    userInfo?: { name: string; email: string };
}

interface IssuedCertificate {
    identifier: string;
    lastIssuedOn: string;
    name: string;
    token: string;
}

interface ContentEnrollment {
    courseId: string;
    courseName: string;
    courseLogoUrl?: string;
    batchId: string;
    content?: any;
    status: number;
    completionPercentage: number;
    completedOn: number;
    issuedCertificates: IssuedCertificate[];
    contentId?: string;
    active?: boolean;
    addedBy?: string;
}

interface EventEnrollment {
    identifier?: string;
    name?: string;
    contentId?: string;
    batchId?: string;
    status?: number;
    completionPercentage?: number;
    completedOn?: number;
    issuedCertificates?: IssuedCertificate[];
    event?: any;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`cert-tabpanel-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

// Collapsible Row Component for Content
const ContentRow: React.FC<{
    enrollment: ContentEnrollment;
    formatDate: (ts: number) => string;
    getStatusLabel: (s: number) => string;
    onViewCertificate: (id: string) => void;
    onReissue: (e: ContentEnrollment) => void;
}> = ({ enrollment, formatDate, getStatusLabel, onViewCertificate, onReissue }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        {(enrollment.content?.posterImage || enrollment.content?.appIcon) && (
                            <Box
                                component="img"
                                src={enrollment.content?.posterImage || enrollment.content?.appIcon}
                                alt=""
                                sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover' }}
                            />
                        )}
                        <Typography variant="body2" fontWeight={500}>{enrollment.courseName}</Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Chip
                        label={getStatusLabel(enrollment.status)}
                        size="small"
                        color={enrollment.status === 2 ? 'success' : enrollment.status === 1 ? 'warning' : 'default'}
                    />
                </TableCell>
                <TableCell>{enrollment.completionPercentage}%</TableCell>
                <TableCell>{enrollment.completedOn ? formatDate(enrollment.completedOn) : '-'}</TableCell>
                <TableCell>
                    {enrollment.issuedCertificates?.length > 0 ? (
                        <Chip label={`${enrollment.issuedCertificates.length} Issued`} size="small" color="primary" icon={<SchoolIcon />} />
                    ) : (
                        <Chip label="None" size="small" variant="outlined" />
                    )}
                </TableCell>
                <TableCell>
                    <Box display="flex" gap={0.5}>
                        {enrollment.issuedCertificates?.length > 0 && (
                            <Tooltip title="View Certificate">
                                <IconButton size="small" color="primary" onClick={() => onViewCertificate(enrollment.issuedCertificates[0].identifier)}>
                                    <VisibilityIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Re-issue Certificate">
                            <span>
                                <IconButton size="small" color="secondary" onClick={() => onReissue(enrollment)} disabled={enrollment.status !== 2}>
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={7} sx={{ py: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Additional Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Course ID</Typography><Typography variant="body2">{enrollment.courseId}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Batch ID</Typography><Typography variant="body2">{enrollment.batchId}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Active</Typography><Typography variant="body2">{enrollment.active ? 'Yes' : 'No'}</Typography></Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

// Event Row Component
const EventRow: React.FC<{
    enrollment: EventEnrollment;
    formatDate: (ts: number) => string;
    getStatusLabel: (s: number) => string;
    onViewCertificate: (id: string) => void;
    onReissue: (e: EventEnrollment) => void;
}> = ({ enrollment, formatDate, getStatusLabel, onViewCertificate, onReissue }) => {
    return (
        <TableRow hover>
            <TableCell>
                <Typography variant="body2" fontWeight={500}>{enrollment.name || enrollment.event?.name || '-'}</Typography>
            </TableCell>
            <TableCell>
                <Chip
                    label={getStatusLabel(enrollment.status || 0)}
                    size="small"
                    color={enrollment.status === 2 ? 'success' : enrollment.status === 1 ? 'warning' : 'default'}
                />
            </TableCell>
            <TableCell>{enrollment.completionPercentage || 0}%</TableCell>
            <TableCell>{enrollment.completedOn ? formatDate(enrollment.completedOn) : '-'}</TableCell>
            <TableCell>
                {enrollment.issuedCertificates && enrollment.issuedCertificates.length > 0 ? (
                    <Chip label={`${enrollment.issuedCertificates.length} Issued`} size="small" color="primary" icon={<SchoolIcon />} />
                ) : (
                    <Chip label="None" size="small" variant="outlined" />
                )}
            </TableCell>
            <TableCell>
                <Box display="flex" gap={0.5}>
                    {enrollment.issuedCertificates && enrollment.issuedCertificates.length > 0 && (
                        <Tooltip title="View Certificate">
                            <IconButton size="small" color="primary" onClick={() => onViewCertificate(enrollment.issuedCertificates![0].identifier)}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Re-issue Certificate">
                        <span>
                            <IconButton size="small" color="secondary" onClick={() => onReissue(enrollment)} disabled={enrollment.status !== 2}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
};

const CertificatesView: React.FC<CertificatesViewProps> = ({ ticketDetails, userId: propUserId, userInfo }) => {
    const [userId, setUserId] = useState<string>(propUserId || '');
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Content state
    const [contentEnrollments, setContentEnrollments] = useState<ContentEnrollment[]>([]);
    const [filteredContent, setFilteredContent] = useState<ContentEnrollment[]>([]);
    const [contentPage, setContentPage] = useState(0);
    const [contentRowsPerPage, setContentRowsPerPage] = useState(10);

    // Event state
    const [eventEnrollments, setEventEnrollments] = useState<EventEnrollment[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<EventEnrollment[]>([]);
    const [eventPage, setEventPage] = useState(0);
    const [eventRowsPerPage, setEventRowsPerPage] = useState(10);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0, 1, 2]);

    // Certificate Dialog
    const [certDialogOpen, setCertDialogOpen] = useState(false);
    const [certificateData, setCertificateData] = useState<string | null>(null);
    const [loadingCert, setLoadingCert] = useState(false);
    const [certError, setCertError] = useState<string | null>(null);
    const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
    const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);

    // Reissue Dialog
    const [reissueDialogOpen, setReissueDialogOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<ContentEnrollment | EventEnrollment | null>(null);
    const [processingReissue, setProcessingReissue] = useState(false);
    const [reissueSuccess, setReissueSuccess] = useState(false);
    const [reissueError, setReissueError] = useState<string | null>(null);

    const formatDate = (timestamp: number): string => {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusLabel = (status: number): string => {
        switch (status) {
            case 0: return 'Not Started';
            case 1: return 'In Progress';
            case 2: return 'Completed';
            default: return 'Unknown';
        }
    };

    // Fetch content enrollments
    const fetchContent = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await usersService.getUserContentEnrollList(userId);
            if (response?.result?.courses) {
                let courses = response.result.courses || [];
                let externalCourses = (response.result.external_courses || []).map((c: any) => ({
                    ...c,
                    courseName: c.content?.name || 'N/A',
                    courseLogoUrl: c.content?.appIcon,
                    contentId: c.courseId,
                }));
                const combined = [...courses, ...externalCourses];
                setContentEnrollments(combined);
                setFilteredContent(combined);
            }
        } catch (err) {
            setError('Failed to load content enrollments');
        } finally {
            setLoading(false);
        }
    };

    // Fetch event enrollments
    const fetchEvents = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await usersService.getUserEventEnrollList(userId);
            if (response?.result?.events) {
                const mapped = response.result.events.map((item: any) => ({
                    identifier: item.contentId || item.event?.identifier,
                    name: item.event?.name,
                    status: item.status,
                    contentId: item.contentId,
                    batchId: item.batchId,
                    completionPercentage: item.completionPercentage || 0,
                    issuedCertificates: item.issuedCertificates || [],
                    completedOn: item.completedOn,
                    event: item.event,
                }));
                setEventEnrollments(mapped);
                setFilteredEvents(mapped);
            }
        } catch (err) {
            setError('Failed to load event enrollments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (propUserId && propUserId !== userId) {
            setUserId(propUserId);
        }
    }, [propUserId]);

    useEffect(() => {
        if (userId) {
            if (tabValue === 0) fetchContent();
            else fetchEvents();
        }
    }, [userId, tabValue]);

    // Apply filters
    useEffect(() => {
        if (contentEnrollments.length > 0) {
            const filtered = contentEnrollments.filter(
                c => c.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) && selectedStatuses.includes(c.status)
            );
            setFilteredContent(filtered);
        }
        if (eventEnrollments.length > 0) {
            const filtered = eventEnrollments.filter(
                e => (e.name || e.event?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) && selectedStatuses.includes(e.status || 0)
            );
            setFilteredEvents(filtered);
        }
    }, [searchQuery, selectedStatuses, contentEnrollments, eventEnrollments]);

    // View certificate
    const handleViewCertificate = async (certId: string) => {
        setSelectedCertId(certId);
        setCertDialogOpen(true);
        setCertificateData(null);
        setCertError(null);
        try {
            setLoadingCert(true);
            const response = await usersService.downloadcertificate(certId);
            if (response?.result?.printUri) {
                setCertificateData(response.result.printUri);
            } else {
                throw new Error('Invalid certificate data');
            }
        } catch (err: any) {
            setCertError(err.message || 'Failed to load certificate');
        } finally {
            setLoadingCert(false);
        }
    };

    // Download handlers
    const downloadAsSVG = () => {
        if (!certificateData) return;
        const link = document.createElement('a');
        link.href = certificateData;
        link.download = `certificate-${selectedCertId}.svg`;
        link.click();
        setDownloadMenuAnchor(null);
    };

    const downloadAsPNG = () => {
        if (!certificateData) return;
        try {
            let svgContent;
            if (certificateData.startsWith('data:image/svg+xml,')) {
                svgContent = decodeURIComponent(certificateData.replace('data:image/svg+xml,', ''));
            } else if (certificateData.startsWith('data:image/svg+xml;base64,')) {
                svgContent = atob(certificateData.replace('data:image/svg+xml;base64,', ''));
            } else {
                svgContent = decodeURIComponent(certificateData.split(',')[1] || '');
            }

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svgContent;
            const svgElement = tempDiv.querySelector('svg');
            if (!svgElement) throw new Error('Invalid SVG');

            const width = parseInt(svgElement.getAttribute('width') || '1000');
            const height = parseInt(svgElement.getAttribute('height') || '700');
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No canvas context');

            const svgString = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `certificate-${selectedCertId}.png`;
                link.click();
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } catch (err) {
            setCertError('Failed to convert to PNG');
        }
        setDownloadMenuAnchor(null);
    };

    // Reissue handlers
    const { handleAction: handleReissueSubmit } = useActionInterceptor({
        actionType: 'Patch',
        onComplete: (ticket) => handleReissueCertificate(ticket),
        getPayload: () => ({})
    });

    const handleOpenReissue = (enrollment: ContentEnrollment | EventEnrollment) => {
        setSelectedEnrollment(enrollment);
        setReissueDialogOpen(true);
        setReissueSuccess(false);
        setReissueError(null);
    };

    const handleReissueCertificate = async (ticket: any) => {
        if (!selectedEnrollment) return;
        try {
            setProcessingReissue(true);
            const isContent = tabValue === 0;
            const request = {
                payload: {
                    request: {
                        userIds: [userId],
                        [isContent ? 'courseId' : 'eventId']: (selectedEnrollment as any).courseId || (selectedEnrollment as any).contentId,
                        batchId: (selectedEnrollment as any).batchId,
                        type: isContent ? 'course' : 'event',
                    }
                },
                changedFields: 'Reissued Certificate',
                module: 'zoho-automation',
                jiraLink: ticket?.jiraLink || '',
                userId: userId
            };
            const response = await usersService.reissuecertificate(request);
            if (response?.result?.result?.result?.status) {
                setReissueSuccess(true);
                setReissueDialogOpen(false);
                setTimeout(() => { tabValue === 0 ? fetchContent() : fetchEvents(); }, 2000);
            }
        } catch (err: any) {
            setReissueError(err.message || 'Failed to reissue certificate');
        } finally {
            setProcessingReissue(false);
        }
    };

    const handleStatusFilter = (status: number) => {
        setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* User ID Info/Input */}
            {!propUserId ? (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <TextField
                            size="small"
                            label="User ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Enter User ID or select a user from User Details tab"
                            sx={{ flex: 1 }}
                        />
                        <Button variant="contained" onClick={() => tabValue === 0 ? fetchContent() : fetchEvents()} disabled={!userId || loading}>
                            Load Certificates
                        </Button>
                    </Box>
                </Paper>
            ) : (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#f0f7ff' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography variant="body1" fontWeight={600}>
                                {userInfo?.name || 'User'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {userInfo?.email || userId}
                            </Typography>
                        </Box>
                        <Button size="small" onClick={() => tabValue === 0 ? fetchContent() : fetchEvents()} disabled={loading} startIcon={<RefreshIcon />}>
                            Refresh
                        </Button>
                    </Box>
                </Paper>
            )}

            {!userId && !propUserId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Please select a user from the <strong>USER DETAILS</strong> tab first, or enter a User ID manually above.
                </Alert>
            )}

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {userId && (
                <Paper sx={{ p: 2 }}>
                    {/* Sub-Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                            <Tab label="CONTENTS" />
                            <Tab label="EVENTS" />
                        </Tabs>
                    </Box>

                    {/* Status Filter Pills */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>Filter:</Typography>
                        {[{ status: 0, label: 'Not Started', color: 'default' }, { status: 1, label: 'In Progress', color: 'warning' }, { status: 2, label: 'Completed', color: 'success' }].map(f => (
                            <Chip
                                key={f.status}
                                label={f.label}
                                size="small"
                                color={selectedStatuses.includes(f.status) ? f.color as any : 'default'}
                                variant={selectedStatuses.includes(f.status) ? 'filled' : 'outlined'}
                                onClick={() => handleStatusFilter(f.status)}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>

                    {/* Search */}
                    <TextField
                        size="small"
                        fullWidth
                        placeholder={tabValue === 0 ? "Search courses..." : "Search events..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        sx={{ mb: 2 }}
                    />

                    {/* Content Tab */}
                    <TabPanel value={tabValue} index={0}>
                        {filteredContent.length === 0 ? (
                            <Alert severity="info">No courses found{searchQuery && ' matching your search'}.</Alert>
                        ) : (
                            <>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell padding="checkbox" />
                                                <TableCell><strong>Course Name</strong></TableCell>
                                                <TableCell><strong>Status</strong></TableCell>
                                                <TableCell><strong>Progress</strong></TableCell>
                                                <TableCell><strong>Completed</strong></TableCell>
                                                <TableCell><strong>Certificates</strong></TableCell>
                                                <TableCell><strong>Actions</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredContent.slice(contentPage * contentRowsPerPage, contentPage * contentRowsPerPage + contentRowsPerPage).map((e, i) => (
                                                <ContentRow key={e.courseId + i} enrollment={e} formatDate={formatDate} getStatusLabel={getStatusLabel} onViewCertificate={handleViewCertificate} onReissue={handleOpenReissue} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredContent.length}
                                    rowsPerPage={contentRowsPerPage}
                                    page={contentPage}
                                    onPageChange={(_, p) => setContentPage(p)}
                                    onRowsPerPageChange={(e) => { setContentRowsPerPage(parseInt(e.target.value)); setContentPage(0); }}
                                />
                            </>
                        )}
                    </TabPanel>

                    {/* Events Tab */}
                    <TabPanel value={tabValue} index={1}>
                        {filteredEvents.length === 0 ? (
                            <Alert severity="info">No events found{searchQuery && ' matching your search'}.</Alert>
                        ) : (
                            <>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell><strong>Event Name</strong></TableCell>
                                                <TableCell><strong>Status</strong></TableCell>
                                                <TableCell><strong>Progress</strong></TableCell>
                                                <TableCell><strong>Completed</strong></TableCell>
                                                <TableCell><strong>Certificates</strong></TableCell>
                                                <TableCell><strong>Actions</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredEvents.slice(eventPage * eventRowsPerPage, eventPage * eventRowsPerPage + eventRowsPerPage).map((e, i) => (
                                                <EventRow key={(e.identifier || '') + i} enrollment={e} formatDate={formatDate} getStatusLabel={getStatusLabel} onViewCertificate={handleViewCertificate} onReissue={handleOpenReissue} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredEvents.length}
                                    rowsPerPage={eventRowsPerPage}
                                    page={eventPage}
                                    onPageChange={(_, p) => setEventPage(p)}
                                    onRowsPerPageChange={(e) => { setEventRowsPerPage(parseInt(e.target.value)); setEventPage(0); }}
                                />
                            </>
                        )}
                    </TabPanel>
                </Paper>
            )}

            {/* Certificate View Dialog */}
            <Dialog open={certDialogOpen} onClose={() => setCertDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Certificate Preview</Typography>
                        <Button variant="contained" startIcon={<DownloadIcon />} onClick={(e) => setDownloadMenuAnchor(e.currentTarget)} disabled={!certificateData || loadingCert}>
                            Download
                        </Button>
                        <Menu anchorEl={downloadMenuAnchor} open={Boolean(downloadMenuAnchor)} onClose={() => setDownloadMenuAnchor(null)}>
                            <MenuItem onClick={downloadAsSVG}><ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon><ListItemText>SVG</ListItemText></MenuItem>
                            <MenuItem onClick={downloadAsPNG}><ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon><ListItemText>PNG</ListItemText></MenuItem>
                        </Menu>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {loadingCert ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    ) : certError ? (
                        <Alert severity="error">{certError}</Alert>
                    ) : certificateData ? (
                        <Box sx={{ width: '100%', height: 500, overflow: 'auto', border: '1px solid #eee', p: 2, display: 'flex', justifyContent: 'center' }}>
                            <Box component="object" data={certificateData} type="image/svg+xml" sx={{ width: '100%', height: '100%' }} />
                        </Box>
                    ) : (
                        <Typography>No certificate data</Typography>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setCertDialogOpen(false)}>Close</Button></DialogActions>
            </Dialog>

            {/* Reissue Dialog */}
            <Dialog open={reissueDialogOpen} onClose={() => setReissueDialogOpen(false)}>
                <DialogTitle>Re-issue Certificate</DialogTitle>
                <DialogContent>
                    {reissueError && <Alert severity="error" sx={{ mb: 2 }}>{reissueError}</Alert>}
                    {reissueSuccess ? (
                        <Alert severity="success">Certificate reissued successfully!</Alert>
                    ) : (
                        <Typography>Are you sure you want to re-issue the certificate for <strong>{(selectedEnrollment as any)?.courseName || (selectedEnrollment as any)?.name || 'this enrollment'}</strong>?</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReissueDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleReissueSubmit} disabled={processingReissue || reissueSuccess}>
                        {processingReissue ? <CircularProgress size={20} /> : 'Re-issue'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CertificatesView;
