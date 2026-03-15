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
import Editor from '@monaco-editor/react';
import { usersService } from '../../../services/users.service';

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

// ------- Collapsible Row -------

interface CollapsibleRowProps {
  plan: CBPlanItem;
  index: number;
  onViewDetails: (planId: string) => void;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({ plan, index, onViewDetails }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
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
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Content List ({plan.contentList?.length || 0})
              </Typography>
              {plan.contentList && plan.contentList.length > 0 ? (
                plan.contentList.map((content, cIdx) => (
                  <Card
                    key={content.identifier || cIdx}
                    variant="outlined"
                    sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}
                  >
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                        {content.name || 'Unnamed Content'}
                      </Typography>
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
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 110 }}>
                                  {label}:
                                </Typography>
                                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </Typography>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No content in this plan.
                </Typography>
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

export const CBPlanPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const moduleState = location.state;

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const rootOrgId = queryParams.get('rootOrgId') || '';
  const userName = queryParams.get('name') || '';
  const userId = queryParams.get('userId') || '';

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
    <Box sx={{ padding: 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Header */}
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
                        onViewDetails={handleViewDetails}
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
