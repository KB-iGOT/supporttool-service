import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
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
  Collapse,
  Grid,
  Card,
  CardContent,
  Button,
  Drawer,
  Divider,
  CircularProgress,
  Tooltip,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Autocomplete from '@mui/material/Autocomplete';
import Editor from '@monaco-editor/react';
import { usersService } from '../../../services/users.service';
import { CourseCertificateActions } from '../../common-components/CourseCertificateActions';

// ------- Types -------

interface ContentItem {
  name?: string;
  identifier?: string;
  primaryCategory?: string;
  status?: string;
  contentType?: string;
  creator?: string;
  duration?: string;
  description?: string;
  mimeType?: string;
  courseCategory?: string;
  difficultyLevel?: string;
  lastPublishedOn?: string;
  createdOn?: string;
  leafNodesCount?: number;
  pkgVersion?: number;
  framework?: string;
  appIcon?: string;
  [key: string]: any;
}

interface CBPlanItem {
  endDate: string;
  isApar: boolean;
  id: string;
  contentList: ContentItem[];
}

// ------- Constants -------

const CONTENT_DISPLAY_FIELDS: { key: string; label: string }[] = [
  { key: 'identifier', label: 'Identifier' },
  { key: 'primaryCategory', label: 'Category' },
  { key: 'courseCategory', label: 'Course Category' },
  { key: 'status', label: 'Status' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'creator', label: 'Creator' },
  { key: 'duration', label: 'Duration (sec)' },
  { key: 'difficultyLevel', label: 'Difficulty' },
  { key: 'mimeType', label: 'MIME Type' },
  { key: 'leafNodesCount', label: 'Leaf Nodes' },
  { key: 'pkgVersion', label: 'Version' },
  { key: 'framework', label: 'Framework' },
  { key: 'lastPublishedOn', label: 'Last Published' },
  { key: 'createdOn', label: 'Created On' },
];

// ------- Helper -------

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ------- Enrollment Helpers -------

type EnrollStatus = 'notStarted' | 'inProgress' | 'completed';

const getEnrollStatus = (status: number | null | undefined): EnrollStatus => {
  if (status === 2) return 'completed';
  if (status === 1) return 'inProgress';
  return 'notStarted';
};

const STATUS_CONFIG: Record<EnrollStatus, { label: string; color: 'default' | 'warning' | 'success' }> = {
  notStarted: { label: 'Not Started', color: 'default' },
  inProgress: { label: 'In Progress', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
};

// ------- Collapsible Row -------

interface CollapsibleRowProps {
  plan: CBPlanItem;
  index: number;
  userId: string;
  onViewDetails: (planId: string) => void;
  onCopy: (text: string, label: string) => void;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({ plan, index, userId, onViewDetails, onCopy }) => {
  const [open, setOpen] = useState(false);
  const [selectedCopyKey, setSelectedCopyKey] = useState<string>('');
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, any>>({});
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EnrollStatus | 'all'>('all');

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && Object.keys(enrollmentMap).length === 0 && plan.contentList?.length > 0) {
      setEnrollLoading(true);
      try {
        const courseIds = plan.contentList.map((c) => c.identifier).filter(Boolean) as string[];
        const response = await usersService.getEnrollmentDetails(userId, courseIds);
        const courses: any[] = response?.result?.courses || [];
        const map: Record<string, any> = {};
        courses.forEach((c) => { map[c.courseId] = c; });
        setEnrollmentMap(map);
      } catch (err) {
        console.error('Failed to fetch enrollment details', err);
      } finally {
        setEnrollLoading(false);
      }
    }
  };

  // Dynamically derive all keys present across content items
  const allContentKeys = useMemo(() => {
    if (!plan.contentList || plan.contentList.length === 0) return [];
    const keySet = new Set<string>();
    plan.contentList.forEach((c) => {
      Object.keys(c).forEach((k) => {
        const v = c[k];
        if (v !== null && v !== undefined && v !== '') keySet.add(k);
      });
    });
    return Array.from(keySet).sort();
  }, [plan.contentList]);

  const handleCopyByKey = () => {
    if (!selectedCopyKey || !plan.contentList) return;
    const values = plan.contentList
      .map((c) => c[selectedCopyKey])
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)));
    onCopy(values.join(', '), `${selectedCopyKey} (${values.length} items)`);
  };

  const statusCounts = useMemo(() => {
    const counts = { notStarted: 0, inProgress: 0, completed: 0 };
    (plan.contentList || []).forEach((c) => {
      const enroll = enrollmentMap[c.identifier || ''];
      const s = getEnrollStatus(enroll?.status);
      counts[s]++;
    });
    return counts;
  }, [plan.contentList, enrollmentMap]);

  const filteredContents = useMemo(() => {
    if (statusFilter === 'all') return plan.contentList || [];
    return (plan.contentList || []).filter((c) => {
      const enroll = enrollmentMap[c.identifier || ''];
      return getEnrollStatus(enroll?.status) === statusFilter;
    });
  }, [plan.contentList, enrollmentMap, statusFilter]);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={handleToggle}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{formatDate(plan.endDate)}</TableCell>
        <TableCell>
          <Chip
            label={plan.isApar ? 'Yes' : 'No'}
            size="small"
            color={plan.isApar ? 'success' : 'default'}
          />
        </TableCell>
        <TableCell>{plan.contentList?.length || 0}</TableCell>
        <TableCell>
          <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
            {plan.id}
          </Typography>
        </TableCell>
        <TableCell>
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={() => onViewDetails(plan.id)}
          >
            View Details
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              {/* Top toolbar: copy-by-key + status filter buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
                  Content List ({plan.contentList?.length || 0})
                </Typography>
                <Autocomplete
                  size="small"
                  sx={{ minWidth: 220 }}
                  options={allContentKeys}
                  value={selectedCopyKey || null}
                  onChange={(_, newVal) => setSelectedCopyKey(newVal || '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Copy all by key" placeholder="Search key..." />
                  )}
                />
                <Tooltip title={selectedCopyKey ? `Copy all "${selectedCopyKey}" values` : 'Select a key first'}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon fontSize="small" />}
                      disabled={!selectedCopyKey}
                      onClick={handleCopyByKey}
                    >
                      Copy
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              {/* Status Filter Buttons */}
              {Object.keys(enrollmentMap).length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    size="small"
                    variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setStatusFilter('all')}
                  >
                    All ({plan.contentList?.length || 0})
                  </Button>
                  <Button
                    size="small"
                    variant={statusFilter === 'notStarted' ? 'contained' : 'outlined'}
                    color="inherit"
                    onClick={() => setStatusFilter('notStarted')}
                  >
                    Not Started ({statusCounts.notStarted})
                  </Button>
                  <Button
                    size="small"
                    variant={statusFilter === 'inProgress' ? 'contained' : 'outlined'}
                    color="warning"
                    onClick={() => setStatusFilter('inProgress')}
                    sx={{ color: statusFilter === 'inProgress' ? 'white' : undefined }}
                  >
                    In Progress ({statusCounts.inProgress})
                  </Button>
                  <Button
                    size="small"
                    variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => setStatusFilter('completed')}
                    sx={{ color: statusFilter === 'completed' ? 'white' : undefined }}
                  >
                    Completed ({statusCounts.completed})
                  </Button>
                </Box>
              )}

              {enrollLoading && <LinearProgress sx={{ mb: 2 }} />}

              {filteredContents.length > 0 ? (
                filteredContents.map((content, cIdx) => {
                  const enroll = enrollmentMap[content.identifier || ''];
                  const enrollStatus = getEnrollStatus(enroll?.status);
                  const statusConf = STATUS_CONFIG[enrollStatus];
                  const progress: number = enroll?.completionPercentage ?? 0;

                  return (
                    <Card
                      key={content.identifier || cIdx}
                      variant="outlined"
                      sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        {/* Name row + status chip + progress */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {content.name || 'Unnamed Content'}
                            </Typography>
                            {content.name && (
                              <Tooltip title="Copy content name">
                                <IconButton size="small" onClick={() => onCopy(content.name!, 'Content name')}>
                                  <ContentCopyIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {enroll && (
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                {progress}%
                              </Typography>
                            )}
                            <Chip
                              label={statusConf.label}
                              size="small"
                              color={statusConf.color}
                            />
                          </Box>
                        </Box>
                        {/* Progress bar */}
                        {enroll && (
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            color={enrollStatus === 'completed' ? 'success' : enrollStatus === 'inProgress' ? 'warning' : 'inherit'}
                            sx={{ mb: 1, height: 4, borderRadius: 2 }}
                          />
                        )}
                        {/* Certificate actions */}
                        {enroll && (
                          <Box sx={{ mb: 1 }}>
                            <CourseCertificateActions
                              userId={userId}
                              courseId={enroll.courseId || content.identifier || ''}
                              batchId={enroll.batchId || ''}
                              courseName={content.name || ''}
                              enrollStatus={enroll.status}
                              issuedCertificates={enroll.issuedCertificates || []}
                              completedOn={enroll.completedOn}
                              compact
                            />
                          </Box>
                        )}
                        {content.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {content.description}
                          </Typography>
                        )}
                        <Grid container spacing={1}>
                          {CONTENT_DISPLAY_FIELDS.map(({ key, label }) => {
                            const value = content[key];
                            if (value === null || value === undefined || value === '') return null;
                            return (
                              <Grid item xs={12} sm={6} key={key}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 110 }}>
                                    {label}:
                                  </Typography>
                                  <Typography variant="caption" sx={{ wordBreak: 'break-all', flex: 1 }}>
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </Typography>
                                  <Tooltip title={`Copy ${label}`}>
                                    <IconButton
                                      size="small"
                                      sx={{ p: 0.25 }}
                                      onClick={() => onCopy(
                                        typeof value === 'object' ? JSON.stringify(value) : String(value),
                                        label
                                      )}
                                    >
                                      <ContentCopyIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                !enrollLoading && (
                  <Typography variant="body2" color="text.secondary">
                    {statusFilter === 'all' ? 'No content in this plan.' : `No ${STATUS_CONFIG[statusFilter].label} contents.`}
                  </Typography>
                )
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ------- Plan Detail Field Config -------

const PLAN_DETAIL_FIELDS: { key: string; label: string }[] = [
  { key: 'id', label: 'Plan ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'isApar', label: 'Is APAR' },
  { key: 'endDate', label: 'End Date' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'publishedat', label: 'Published At' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdByName', label: 'Created By Name' },
];

// ------- Main Page Component -------

interface CBPlanPageProps {
  userIdProp?: string;
  emailProp?: string;
  rootOrgIdProp?: string;
  userNameProp?: string;
  embedded?: boolean;
}

export const CBPlanPage: React.FC<CBPlanPageProps> = ({ userIdProp, emailProp, rootOrgIdProp, userNameProp, embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const moduleState = location.state;

  const queryParams = new URLSearchParams(location.search);
  const email = emailProp || queryParams.get('email') || '';
  const rootOrgId = rootOrgIdProp || queryParams.get('rootOrgId') || '';
  const userName = userNameProp || queryParams.get('name') || '';
  const userId = userIdProp || queryParams.get('userId') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (email && rootOrgId) {
      fetchCBPlan();
    }
  }, [email, rootOrgId]);

  const fetchCBPlan = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await usersService.getCBPlan(email, rootOrgId);
      setData(response);
    } catch (err: any) {
      const msg =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch CBP plan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const contentItems: CBPlanItem[] = useMemo(() => {
    return data?.result?.content || [];
  }, [data]);

  const totalCount: number = data?.result?.count || 0;

  const filteredItems: CBPlanItem[] = useMemo(() => {
    if (!searchQuery.trim()) return contentItems;
    const query = searchQuery.toLowerCase().trim();
    return contentItems.filter((item) =>
      item.contentList?.some(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.identifier?.toLowerCase().includes(query)
      )
    );
  }, [contentItems, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Drawer handlers
  const handleViewDetails = async (planId: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError(null);
    setPlanDetails(null);
    try {
      const response = await usersService.getCBPlanDetails(planId);
      setPlanDetails(response?.result?.content || null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch plan details';
      setDrawerError(msg);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setPlanDetails(null);
    setDrawerError(null);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnackbarMessage(`${label} copied to clipboard`);
      setSnackbarOpen(true);
    });
  };

  return (
    <Box sx={{ padding: embedded ? 0 : 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Header */}
      {!embedded && (
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() =>
              navigate('/users', {
                state: {
                  ...moduleState,
                  searchUserId: userId,
                  searchType: 'userId',
                  autoSearch: true,
                },
              })
            }
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <div>
            <Typography variant="h4" component="h1">
              CBP Plan
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {userName ? `${userName} — ` : ''}
              {email}
            </Typography>
          </div>
        </Box>
        {totalCount > 0 && (
          <Chip label={`Total Plans: ${totalCount}`} color="primary" variant="outlined" />
        )}
      </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!email || !rootOrgId ? (
        <Alert severity="warning">
          Email or Root Org ID is missing. Cannot fetch CBP plan.
        </Alert>
      ) : (
        <Paper elevation={3} sx={{ p: 2 }}>
          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by content name or identifier..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Table */}
          {!loading && filteredItems.length === 0 ? (
            <Alert severity="info">
              {searchQuery
                ? 'No plans match your search.'
                : 'No CBP plans found for this user.'}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={50} />
                      <TableCell width={60}>#</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Is APAR</TableCell>
                      <TableCell>Content Count</TableCell>
                      <TableCell>Plan ID</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedItems.map((plan, idx) => (
                      <CollapsibleRow
                        key={plan.id}
                        plan={plan}
                        index={page * rowsPerPage + idx}
                        userId={userId}
                        onViewDetails={handleViewDetails}
                        onCopy={handleCopy}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredItems.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </>
          )}
        </Paper>
      )}

      {/* Plan Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: '60%', md: '50%' } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Plan Details</Typography>
          <IconButton onClick={handleCloseDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
          {drawerLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : drawerError ? (
            <Alert severity="error">{drawerError}</Alert>
          ) : planDetails ? (
            <>
              {/* Training Plan Details */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Training Plan Info
                <Tooltip title="Copy all details as JSON">
                  <IconButton
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => {
                      const details: Record<string, any> = {};
                      PLAN_DETAIL_FIELDS.forEach(({ key }) => {
                        if (planDetails[key] !== undefined) details[key] = planDetails[key];
                      });
                      handleCopy(JSON.stringify(details, null, 2), 'Plan details');
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>

              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  {PLAN_DETAIL_FIELDS.map(({ key, label }) => {
                    const value = planDetails[key];
                    if (value === undefined || value === null || value === '') return null;
                    const displayVal =
                      typeof value === 'boolean'
                        ? value ? 'Yes' : 'No'
                        : (key === 'endDate' || key === 'createdAt' || key === 'publishedat')
                          ? formatDate(value)
                          : String(value);
                    return (
                      <Box
                        key={key}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          py: 0.75,
                          '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 140 }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                          {displayVal}
                        </Typography>
                        <Tooltip title={`Copy ${label}`}>
                          <IconButton size="small" onClick={() => handleCopy(displayVal, label)}>
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>

              {/* ContentList Accordion */}
              <Accordion defaultExpanded variant="outlined" sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Content List ({planDetails.contentList?.length || 0})
                  </Typography>
                  <Tooltip title="Copy contentList JSON">
                    <IconButton
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(JSON.stringify(planDetails.contentList || [], null, 2), 'Content List');
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ height: 400, border: '1px solid #ccc' }}>
                    <Editor
                      height="100%"
                      language="json"
                      value={JSON.stringify(planDetails.contentList || [], null, 2)}
                      options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false }, wordWrap: 'on' }}
                      loading={<CircularProgress />}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* ContextData Accordion */}
              <Accordion variant="outlined" sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Context Data
                  </Typography>
                  <Tooltip title="Copy contextData JSON">
                    <IconButton
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(JSON.stringify(planDetails.contextData || {}, null, 2), 'Context Data');
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ height: 300, border: '1px solid #ccc' }}>
                    <Editor
                      height="100%"
                      language="json"
                      value={JSON.stringify(planDetails.contextData || {}, null, 2)}
                      options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false }, wordWrap: 'on' }}
                      loading={<CircularProgress />}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </>
          ) : null}
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};
