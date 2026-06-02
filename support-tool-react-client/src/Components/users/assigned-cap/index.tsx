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
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
  content: ContentItem;
  index: number;
  enroll: any | undefined;
  userId: string;
  onCopy: (text: string) => void;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({ content, index, enroll, userId, onCopy }) => {
  const [open, setOpen] = useState(false);

  const enrollStatus = getEnrollStatus(enroll?.status);
  const statusConf = STATUS_CONFIG[enrollStatus];
  const progress: number = enroll?.completionPercentage ?? 0;

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{index + 1}</TableCell>
        <TableCell>
          <Box display="flex" alignItems="center">
            {content.appIcon && (
              <Box
                component="img"
                src={content.appIcon}
                alt=""
                sx={{ width: 40, height: 40, mr: 2, borderRadius: 1 }}
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            )}
            <Typography variant="body2">{content.name || 'Unnamed Course'}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={content.status || 'Unknown'}
            size="small"
            color={content.status === 'Live' ? 'success' : 'default'}
          />
        </TableCell>
        <TableCell>{content.courseCategory || '—'}</TableCell>
        <TableCell>{content.creator || '—'}</TableCell>
        {/* Enrollment status column */}
        <TableCell>
          {enroll !== undefined ? (
            <Box sx={{ minWidth: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Chip label={statusConf.label} size="small" color={statusConf.color} />
                <Typography variant="caption" color="text.secondary">{progress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={enrollStatus === 'completed' ? 'success' : enrollStatus === 'inProgress' ? 'warning' : 'inherit'}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">—</Typography>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  {/* Certificate actions */}
                  {enroll && (
                    <Box sx={{ mb: 1.5 }}>
                      <CourseCertificateActions
                        userId={userId}
                        courseId={enroll.courseId || content.identifier || ''}
                        batchId={enroll.batchId || ''}
                        courseName={content.name || ''}
                        enrollStatus={enroll.status}
                        issuedCertificates={enroll.issuedCertificates || []}
                        completedOn={enroll.completedOn}
                      />
                    </Box>
                  )}
                  {content.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {content.description}
                    </Typography>
                  )}
                  <Grid container spacing={1}>
                    {CONTENT_DISPLAY_FIELDS.map(({ key, label }) => {
                      const value = content[key];
                      if (value === null || value === undefined || value === '') return null;
                      const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
                      return (
                        <Grid item xs={12} sm={6} key={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 110 }}>
                              {label}:
                            </Typography>
                            <Typography variant="caption" sx={{ wordBreak: 'break-all', flex: 1 }}>
                              {displayVal}
                            </Typography>
                            <Tooltip title={`Copy ${label}`}>
                              <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onCopy(displayVal)}>
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
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ------- Main Page Component -------

interface AssignedCAPPageProps {
  userIdProp?: string;
  emailProp?: string;
  rootOrgIdProp?: string;
  userNameProp?: string;
  embedded?: boolean;
}

export const AssignedCAPPage: React.FC<AssignedCAPPageProps> = ({ userIdProp, emailProp, rootOrgIdProp, userNameProp, embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const moduleState = location.state;

  const queryParams = new URLSearchParams(location.search);
  const email = emailProp || queryParams.get('email') || '';
  const userId = userIdProp || queryParams.get('userId') || '';
  const userName = userNameProp || queryParams.get('name') || '';
  const rootOrgId = rootOrgIdProp || queryParams.get('rootOrgId') || '';


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Enrollment state
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, any>>({});
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EnrollStatus | 'all'>('all');

  // Clipboard snackbar (simple)
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (userId) {
      fetchAssignedCAP();
    }
  }, [userId]);

  const fetchAssignedCAP = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setEnrollmentMap({});
    try {
      const response = await usersService.getAssignedCAP(userId, rootOrgId);
      setData(response);
      // Fetch enrollment details for all courses
      const courses: ContentItem[] = response?.result?.content || [];
      const courseIds = courses.map((c: ContentItem) => c.identifier).filter(Boolean) as string[];
      if (courseIds.length > 0 && userId) {
        setEnrollLoading(true);
        try {
          const enrollResponse = await usersService.getEnrollmentDetails(userId, courseIds);
          const enrollCourses: any[] = enrollResponse?.result?.courses || [];
          const map: Record<string, any> = {};
          enrollCourses.forEach((c) => { map[c.courseId] = c; });
          setEnrollmentMap(map);
        } catch (e) {
          console.error('Failed to fetch enrollment details', e);
        } finally {
          setEnrollLoading(false);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch assigned CAP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const contentItems: ContentItem[] = useMemo(() => {
    return data?.result?.content || [];
  }, [data]);

  const totalCount: number = data?.result?.count || contentItems.length;

  const statusCounts = useMemo(() => {
    const counts = { notStarted: 0, inProgress: 0, completed: 0 };
    contentItems.forEach((c) => {
      const enroll = enrollmentMap[c.identifier || ''];
      const s = getEnrollStatus(enroll?.status);
      counts[s]++;
    });
    return counts;
  }, [contentItems, enrollmentMap]);

  const filteredItems: ContentItem[] = useMemo(() => {
    let items = contentItems;
    if (statusFilter !== 'all') {
      items = items.filter((c) => {
        const enroll = enrollmentMap[c.identifier || ''];
        return getEnrollStatus(enroll?.status) === statusFilter;
      });
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.identifier?.toLowerCase().includes(query)
      );
    }
    return items;
  }, [contentItems, searchQuery, statusFilter, enrollmentMap]);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box sx={{ padding: embedded ? 0 : 3 }}>
      {(loading || enrollLoading) && <LinearProgress sx={{ mb: 2 }} />}

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
              Assigned CAP
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {userName ? `${userName} — ` : ''}
              {email}
            </Typography>
          </div>
        </Box>
        {totalCount > 0 && (
          <Chip label={`Total Courses: ${totalCount}`} color="primary" variant="outlined" />
        )}
      </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!email || !userId ? (
        <Alert severity="warning">
          Email or User ID is missing. Cannot fetch assigned CAP.
        </Alert>
      ) : (
        <Paper elevation={3} sx={{ p: 2 }}>
          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by course name or identifier..."
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

          {/* Status Filter Buttons */}
          {Object.keys(enrollmentMap).length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                size="small"
                variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => { setStatusFilter('all'); setPage(0); }}
              >
                All ({contentItems.length})
              </Button>
              <Button
                size="small"
                variant={statusFilter === 'notStarted' ? 'contained' : 'outlined'}
                color="inherit"
                onClick={() => { setStatusFilter('notStarted'); setPage(0); }}
              >
                Not Started ({statusCounts.notStarted})
              </Button>
              <Button
                size="small"
                variant={statusFilter === 'inProgress' ? 'contained' : 'outlined'}
                color="warning"
                onClick={() => { setStatusFilter('inProgress'); setPage(0); }}
                sx={{ color: statusFilter === 'inProgress' ? 'white' : undefined }}
              >
                In Progress ({statusCounts.inProgress})
              </Button>
              <Button
                size="small"
                variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
                color="success"
                onClick={() => { setStatusFilter('completed'); setPage(0); }}
                sx={{ color: statusFilter === 'completed' ? 'white' : undefined }}
              >
                Completed ({statusCounts.completed})
              </Button>
            </Box>
          )}

          {/* Table */}
          {!loading && filteredItems.length === 0 ? (
            <Alert severity="info">
              {searchQuery
                ? 'No courses match your search.'
                : statusFilter !== 'all'
                ? `No ${STATUS_CONFIG[statusFilter].label} courses found.`
                : 'No assigned CAP courses found for this user.'}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={50} />
                      <TableCell width={60}>#</TableCell>
                      <TableCell>Course Name</TableCell>
                      <TableCell>Content Status</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Creator</TableCell>
                      <TableCell>Enrollment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedItems.map((content, idx) => (
                      <CollapsibleRow
                        key={content.identifier || idx}
                        content={content}
                        index={page * rowsPerPage + idx}
                        enroll={enrollmentMap[content.identifier || '']}
                        userId={userId}
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

      {/* Copy feedback */}
      {copied && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: 'grey.800',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: 14,
            zIndex: 9999,
          }}
        >
          Copied!
        </Box>
      )}
    </Box>
  );
};