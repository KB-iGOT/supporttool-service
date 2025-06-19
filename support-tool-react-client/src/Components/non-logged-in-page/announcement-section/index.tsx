import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Link,
  Divider
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';
import AddIcon from '@mui/icons-material/Add';
import { nonLoggedInServive } from '../../../services/non-loggedin.service';
import { EllipsisCell } from '../../common-components/ellipsis-cell/ellipsis-cell';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';

interface ContentItem {
  identifier: string;
  name: string;
  description: string;
  position: string;
  startDate?: string;
  endDate?: string;
  registrationEndDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  artifactUrl?: string;
  registrationLink?: string;
  source: string;
  status: string;
}

interface SearchResponse {
  id: string;
  responseCode: string;
  result: {
    count: number;
    content: ContentItem[];
    facets: Array<{
      name: string;
      values: Array<{
        name: string;
        count: number;
      }>;
    }>;
  };
}

export const AnnouncementSection: React.FC = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [copyStatus, setCopyStatus] = useState<{ id: string; copied: boolean } | null>(null);

  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFromQuery = queryParams.get('id');
  const category = id || categoryFromQuery || 'career';

  const navigate = useNavigate();
  const { checkPermissions } = React.useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

  useEffect(() => {
    fetchContents();
  }, [category, page, rowsPerPage]);

  const fetchContents = async () => {
    setLoading(true);
    setError(null);

    try {
      let requestData = {
        request: {
          filters: {
            primaryCategory: [category],
            status: { '!=': 'Retired' }
          },
          facets: ['name', 'source', 'position'],
          sortBy: { createdOn: 'Desc' },
          limit: rowsPerPage,
          offset: page * rowsPerPage
        }
      };
      const response = await nonLoggedInServive.privateSearch(requestData);

      const data: SearchResponse = response;

      if (data.responseCode === 'OK') {
        setContentItems(data?.result?.content || []);
        setTotalCount(data.result.count);
      } else {
        setError('Failed to fetch data. Please try again.');
      }
    } catch (err: any) {
      console.error('Error fetching content:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';

    try {
      const timePart = timeString.split('+')[0];
      const [hours, minutes] = timePart.split(':');

      return `${hours}:${minutes}`;
    } catch (e) {
      return timeString;
    }
  };

  const parseLocation = (locationStr?: string) => {
    if (!locationStr) return 'N/A';

    try {
      const locationObj = JSON.parse(locationStr);
      return locationObj.place || 'N/A';
    } catch (e) {
      return locationStr;
    }
  };

  const openDocument = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const copyToClipboard = (id: string, url?: string) => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopyStatus({ id, copied: true });

      setTimeout(() => {
        setCopyStatus(null);
      }, 2000);
    }
  };

  const getStatusColor = (item: ContentItem) => {
    if (item.status === 'Live') return 'success';
    if (item.status === 'Draft') return 'default';

    if (item.position?.toLowerCase() === 'closed') return 'error';

    const now = new Date();

    if (item.endDate) {
      const endDate = new Date(item.endDate);
      if (endDate < now) return 'error';
    }

    if (item.registrationEndDate) {
      const regEndDate = new Date(item.registrationEndDate);
      if (regEndDate < now) return 'warning';
    }

    return 'primary';
  };

  const getTitle = () => {
    switch (category.toLowerCase()) {
      case 'career':
        return 'Career Opportunities';
      case 'news':
        return 'News & Announcements';
      default:
        return `${category.charAt(0).toUpperCase() + category.slice(1)} Listings`;
    }
  };

  const handleCreateContent = () => {
    navigate(`/non-logged-in-page/career/upload-contents?primaryCategory=${category}`);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          {getTitle()}
        </Typography>

        {permissions.canWrite && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateContent}
            sx={{
              minWidth: '160px',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 3
              }
            }}
          >
            Create Content
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress />
        </Box>
      ) : contentItems.length > 0 ? (
        <Box>
          <TableContainer component={Paper} elevation={3}>
            <Table sx={{ minWidth: 650 }} aria-label="content table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Position</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {contentItems.map((item) => (
                  <TableRow key={item.identifier} hover>
                    <TableCell>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                        <EllipsisCell text={item.name} maxWidth={350} maxLines={2} />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <EllipsisCell
                          text={item.description || 'No description available'}
                          maxWidth={300}
                          maxLines={2}
                          lineHeight={18}
                        />
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={item.position || 'N/A'}
                        size="small"
                        color={item.position?.toLowerCase() === 'open' ? 'success' : 'default'}
                      />
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PlaceIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{parseLocation(item.location)}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                          </Typography>
                        </Box>
                        {item.startTime && item.endTime && (
                          <Box display="flex" alignItems="center">
                            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {formatTime(item.startTime)} - {formatTime(item.endTime)}
                            </Typography>
                          </Box>
                        )}
                        {item.registrationEndDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Registration ends: {formatDate(item.registrationEndDate)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PublicIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{item.source || 'Unknown'}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={item.status || 'Unknown'}
                        size="small"
                        color={
                          getStatusColor(item) as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'
                        }
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {item.artifactUrl && (
                          <>
                            <Tooltip title="View Document">
                              <IconButton
                                size="small"
                                onClick={() => openDocument(item.artifactUrl)}
                                color="primary"
                              >
                                <DescriptionIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                component="a"
                                href={item.artifactUrl}
                                download
                                target="_blank"
                                color="primary"
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip
                              title={
                                copyStatus?.id === item.identifier && copyStatus.copied ? 'Copied!' : 'Copy Link'
                              }
                            >
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(item.identifier, item.artifactUrl)}
                                color={
                                  copyStatus?.id === item.identifier && copyStatus.copied ? 'success' : 'primary'
                                }
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {item.registrationLink && (
                          <Tooltip title="Registration Link">
                            <IconButton
                              size="small"
                              component="a"
                              href={item.registrationLink}
                              target="_blank"
                              color="secondary"
                            >
                              <LinkIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            No {category.toLowerCase()} items found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            There are currently no items to display in this category.
          </Typography>

          {permissions.canWrite && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateContent}
            >
              Create New {category.charAt(0).toUpperCase() + category.slice(1)} Item
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
};