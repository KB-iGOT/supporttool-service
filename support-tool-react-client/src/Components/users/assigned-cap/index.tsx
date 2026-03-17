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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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

// ------- Collapsible Row -------

interface CollapsibleRowProps {
  content: ContentItem;
  index: number;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({ content, index }) => {
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
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  {content.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5 }}
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
  userNameProp?: string;
  embedded?: boolean;
}

export const AssignedCAPPage: React.FC<AssignedCAPPageProps> = ({ userIdProp, emailProp, userNameProp, embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const moduleState = location.state;

  const queryParams = new URLSearchParams(location.search);
  const email = emailProp || queryParams.get('email') || '';
  const userId = userIdProp || queryParams.get('userId') || '';
  const userName = userNameProp || queryParams.get('name') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    if (email && userId) {
      fetchAssignedCAP();
    }
  }, [email, userId]);

  const fetchAssignedCAP = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await usersService.getAssignedCAP(email, userId);
      setData(response);
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

  const filteredItems: ContentItem[] = useMemo(() => {
    if (!searchQuery.trim()) return contentItems;
    const query = searchQuery.toLowerCase().trim();
    return contentItems.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.identifier?.toLowerCase().includes(query)
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

          {/* Table */}
          {!loading && filteredItems.length === 0 ? (
            <Alert severity="info">
              {searchQuery
                ? 'No courses match your search.'
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
                      <TableCell>Status</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Creator</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedItems.map((content, idx) => (
                      <CollapsibleRow
                        key={content.identifier || idx}
                        content={content}
                        index={page * rowsPerPage + idx}
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
    </Box>
  );
};
