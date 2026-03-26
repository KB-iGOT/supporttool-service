import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Paper, Chip,
  TextField, Grid, Button, CircularProgress, Alert, Menu, MenuItem,
  IconButton, Autocomplete, InputAdornment,
} from '@mui/material';
import {
  Search, Clear, Add as AddIcon, MoreVert,
  Edit as EditIcon, Visibility as ViewIcon, Business as BusinessIcon,
} from '@mui/icons-material';
import { useDebounce } from '../../hooks/useDebounce';
import { playlistService } from '../../services/playlist.service';
import { organisationService } from '../../services/organisations.service';
import { CreatePlaylistDialog } from './CreatePlaylistDialog';
import { EditPlaylistDialog } from './EditPlaylistDialog';
import { PlaylistDetailDialog } from './PlaylistDetailDialog';

interface OrgOption {
  identifier: string;
  channel: string;
}

interface PlaylistItem {
  id: string;
  type: string;
  orgId: string;
  ownerId: string;
  children: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export const Playlists: React.FC = () => {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [typeFilter, setTypeFilter] = useState('MDO_FEATURED_COURSES');
  const [orgIdFilter, setOrgIdFilter] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [orgSearchLoading, setOrgSearchLoading] = useState(false);
  const orgSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedTypeFilter = useDebounce(typeFilter, 300);

  // Dialogs
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistItem | null>(null);

  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPlaylist, setMenuPlaylist] = useState<PlaylistItem | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    open: boolean; message: string; severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Org search helper
  const searchOrgs = useCallback(async (query: string) => {
    setOrgSearchLoading(true);
    try {
      const response = await organisationService.fetchOrganisationsData({
        request: {
          filters: { status: 1 },
          fields: ['identifier', 'channel'],
          sortBy: { createdDate: 'Desc' },
          limit: 20,
          offset: 0,
          query,
        },
      });
      const orgs = response?.result?.response?.content || [];
      setOrgOptions(orgs);
    } catch {
      setOrgOptions([]);
    } finally {
      setOrgSearchLoading(false);
    }
  }, []);

  // Initial org list
  useEffect(() => { searchOrgs(''); }, [searchOrgs]);

  const handleOrgInputChange = (_e: any, value: string) => {
    if (orgSearchTimer.current) clearTimeout(orgSearchTimer.current);
    orgSearchTimer.current = setTimeout(() => searchOrgs(value), 300);
  };

  const handleOrgFilterSelect = (_e: any, value: OrgOption | null) => {
    setSelectedOrg(value);
    setOrgIdFilter(value?.identifier || '');
    setPage(0);
  };

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const filterCriteriaMap: Record<string, any> = {};
      if (debouncedTypeFilter.trim()) {
        filterCriteriaMap.type = debouncedTypeFilter.trim();
      }
      if (orgIdFilter.trim()) {
        filterCriteriaMap.orgId = orgIdFilter.trim();
      }
      const response = await playlistService.searchPlaylists(page, rowsPerPage, filterCriteriaMap);
      const data = response?.result?.data || response?.result?.content || response?.data || [];
      const count = response?.result?.totalCount ?? response?.result?.totalElements ?? data.length;
      setPlaylists(Array.isArray(data) ? data : []);
      setTotalCount(count);
    } catch (err: any) {
      console.error('Error fetching playlists:', err);
      setNotification({
        open: true,
        message: err?.response?.data?.responseMessage || 'Failed to fetch playlists',
        severity: 'error',
      });
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedTypeFilter, orgIdFilter]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Handlers
  const handlePageChange = (_e: unknown, newPage: number) => setPage(newPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, playlist: PlaylistItem) => {
    setAnchorEl(e.currentTarget);
    setMenuPlaylist(playlist);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPlaylist(null);
  };

  const handleView = () => {
    if (menuPlaylist) {
      setSelectedPlaylist(menuPlaylist);
      setDetailOpen(true);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (menuPlaylist) {
      setSelectedPlaylist(menuPlaylist);
      setEditOpen(true);
    }
    handleMenuClose();
  };

  const handleCreateSuccess = () => {
    setNotification({ open: true, message: 'Playlist created successfully', severity: 'success' });
    fetchPlaylists();
  };

  const handleEditSuccess = () => {
    setNotification({ open: true, message: 'Playlist updated successfully', severity: 'success' });
    fetchPlaylists();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600}>Playlists</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
              sx={{ textTransform: 'none', borderRadius: 2 }}>
              Create Playlist
            </Button>
          </Box>

          {/* Notification */}
          {notification.open && (
            <Alert
              severity={notification.severity}
              onClose={() => setNotification(prev => ({ ...prev, open: false }))}
              sx={{ mb: 2 }}
            >
              {notification.message}
            </Alert>
          )}

          {/* Filters */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth size="small" label="Type Filter"
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: typeFilter ? (
                    <IconButton size="small" onClick={() => { setTypeFilter(''); setPage(0); }}>
                      <Clear fontSize="small" />
                    </IconButton>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                size="small"
                options={orgOptions}
                getOptionLabel={(opt) => `${opt.channel} (${opt.identifier})`}
                value={selectedOrg}
                onChange={handleOrgFilterSelect}
                onInputChange={handleOrgInputChange}
                loading={orgSearchLoading}
                filterOptions={(x) => x}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Organization"
                    placeholder="Search org by name..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {orgSearchLoading ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.identifier}>
                    {option.channel}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({option.identifier})</Typography>
                  </li>
                )}
                noOptionsText="No organizations found"
              />
            </Grid>
          </Grid>

          {/* Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Playlist ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Org ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Owner ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Children</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" sx={{ mt: 1 }}>Loading playlists...</Typography>
                    </TableCell>
                  </TableRow>
                ) : playlists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">No playlists found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  playlists.map((pl, idx) => (
                    <TableRow key={pl.id || idx} hover>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {pl.id || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={pl.type || '-'} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {pl.orgId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {pl.ownerId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={pl.children?.length || 0} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={e => handleMenuOpen(e, pl)}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <CreatePlaylistDialog
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditPlaylistDialog
        open={isEditOpen}
        playlist={selectedPlaylist}
        onClose={() => { setEditOpen(false); setSelectedPlaylist(null); }}
        onSuccess={handleEditSuccess}
      />
      <PlaylistDetailDialog
        open={isDetailOpen}
        playlistData={selectedPlaylist || ''}
        orgId={selectedPlaylist?.orgId || ''}
        onClose={() => { setDetailOpen(false); setSelectedPlaylist(null); }}
      />
    </Box>
  );
};
