import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { organisationService } from '../../services/organisations.service';
import { JsonViewerDialog } from '../common-components/JsonViewerDialog';

const DEBOUNCE_DELAY = 500;

// Type definitions for organization data
interface Organisation {
  id: string;
  channel: string;
  orgName: string;
  status: number;
  isTenant: boolean;
  createdDate: string;
  imgUrl: string;
  ministryOrStateType: string;
  ministryOrStateName: string;
  description: string;
  [key: string]: any;
}

export const OrganisationList: React.FC = () => {
  const navigate = useNavigate();

  // State declarations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Menu and Dialog state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOrg, setMenuOrg] = useState<Organisation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchOrganisations = useCallback(async (limit: number, offset: number, query: string) => {
    try {
      setLoading(true);
      setError(null);

      const requestPayload = {
        "request": {
          "filters": {
            "isTenant": true,
            "status": 1,
            "isMdo": true
          },
          "sort_by": {
            "createdDate": "desc"
          },
          "limit": limit,
          "offset": offset,
          "query": query
        }
      };

      const response = await organisationService.fetchOrganisationsData(requestPayload);

      if (response.result && response.result.response && Array.isArray(response.result.response.content)) {
        setOrganisations(response.result.response.content);
        setTotalCount(response.result.response.count);
      } else {
        throw new Error("Invalid response structure from API");
      }
    } catch (err) {
      console.error('Error fetching organisations:', err);
      setError('Failed to fetch organisation information');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0); // Reset to first page on new search
      fetchOrganisations(rowsPerPage, 0, searchQuery);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, rowsPerPage, fetchOrganisations]);

  useEffect(() => {
    fetchOrganisations(rowsPerPage, page * rowsPerPage, searchQuery);
  }, [page, fetchOrganisations]); // Removed rowsPerPage and searchQuery as they are handled above

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, org: Organisation) => {
    setAnchorEl(event.currentTarget);
    setMenuOrg(org);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    if (menuOrg) {
      setDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setMenuOrg(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Box sx={{pt: 3, pb: 5}}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Search Organisations"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Organisation Name or Channel..."
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
      </Paper>
      
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Logo</TableCell>
                <TableCell>Organisation Name</TableCell>
                <TableCell>Ministry/State Type</TableCell>
                <TableCell>Ministry/State Name</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organisations.map((org) => (
                <TableRow key={org.id} hover>
                  <TableCell>
                    {org.logo ? (
                      <img 
                        src={org.logo} 
                        alt={org.orgName} 
                        style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '4px' }} 
                      />
                    ) : (
                      <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', borderRadius: '4px' }}>
                        <BusinessIcon color="action" />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{org.orgName}</TableCell>
                  <TableCell>
                    <Chip label={org.ministryOrStateType || 'N/A'} size="small" />
                  </TableCell>
                  <TableCell>{org.ministryOrStateName || 'N/A'}</TableCell>
                  <TableCell>{org.channel}</TableCell>
                  <TableCell>{formatDate(org.createdDate)}</TableCell>
                  <TableCell>
                    <Chip label={org.status === 1 ? 'Active' : 'Inactive'} color={org.status === 1 ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="actions"
                      size="small"
                      onClick={(event) => handleMenuOpen(event, org)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Full Details</ListItemText>
        </MenuItem>
      </Menu>

      <JsonViewerDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={`Organisation Details: ${menuOrg?.orgName || ''}`}
        data={menuOrg}
      />
    </Box>
  );
};