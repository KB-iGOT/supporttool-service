import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Menu,
} from '@mui/material';
import Button from '@mui/material/Button';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import { ListItemIcon, ListItemText } from '@mui/material';
import { designationService } from '../../../services/designations.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';
import { UploadDesignationsDialog } from './UploadDesignationsDialog';
import sampleCsv from '../../../assets/sample-files/MasterDesignation_Sample.csv';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';
import ConfirmationDialog from './ConfirmationDialog';
import { UpdateDesignationDialog } from './UpdateDesignationDialog';

interface MasterDesignation {
  name: string;
  id: string;
  description: string;
  status: string;
  designation: string;
}

export const MasterDesignations = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masterDesignations, setMasterDesignations] = useState<MasterDesignation[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterDesignation | null>(null);
  const [updateTarget, setUpdateTarget] = useState<MasterDesignation | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<MasterDesignation | null>(null);
  const { checkPermissions } = React.useContext(AppContext) as appContextType;

  const permissions = checkPermissions('/bulk-upload/master-designation');

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchMasterDesignations = useCallback(async (query: string, status: string, currentPage: number, pageSize: number) => {
    setLoading(true);
    setError(null);
    try {
      const masterRes = await designationService.searchMasterDesignations(query, currentPage, pageSize, status);
      if (masterRes.result?.result?.data) {
        setMasterDesignations(masterRes.result.result.data);
        setTotalCount(masterRes.result.result.totalCount || 0);
      } else {
        setMasterDesignations([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error('Error fetching master designations:', err);
      setError(err?.response?.data?.message || 'Failed to load master designations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reset to page 0 whenever the search query changes
    setPage(0);
  }, [debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    fetchMasterDesignations(debouncedSearchQuery, statusFilter, page, rowsPerPage);
  }, [debouncedSearchQuery, statusFilter, page, rowsPerPage, fetchMasterDesignations]); // page will be updated by the effect above

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (auditData: any) => {
    if (!deleteTarget) return;

    try {
      await designationService.deleteDesignation(deleteTarget.id, auditData); // Assuming this service exists
      fetchMasterDesignations(debouncedSearchQuery, statusFilter, page, rowsPerPage);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete designation.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const { handleAction: handleDeleteAction } = useActionInterceptor({
    actionType: 'DESIGNATION_DELETE',
    onComplete: handleDelete,
    getPayload: () => ({ designationId: deleteTarget?.id, designationName: deleteTarget?.designation }),
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, designation: MasterDesignation) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDesignation(designation);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDesignation(null);
  };

  const handleUpdate = () => {
    if (selectedDesignation) setUpdateTarget(selectedDesignation);
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedDesignation) setDeleteTarget(selectedDesignation);
    handleMenuClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Master Designations
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            href={sampleCsv}
            download="MasterDesignation_Sample.csv"
            sx={{ mr: 2 }}
          >
            Download Sample
          </Button>
          {permissions.canWrite && (
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Designations
            </Button>
          )}
        </Box>
      </Box>
      <Paper elevation={3}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Search Designations"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                endAdornment: (
                  <InputAdornment position="end">
                    {searchQuery && (
                      <IconButton onClick={() => setSearchQuery('')} edge="end">
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
            <FormControl variant="outlined" sx={{ minWidth: 150 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {masterDesignations.map((des) => (
                  <TableRow key={des.id}>
                    <TableCell>{des.designation}</TableCell>
                    <TableCell>{des.description || 'N/A'}</TableCell>
                    <TableCell><Chip label={des.status} size="small" color={des.status === 'Live' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{des.id}</TableCell>
                    <TableCell align="right" sx={{ py: 0 }}>
                      <IconButton
                        aria-label="actions"
                        onClick={(event) => handleMenuOpen(event, des)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination rowsPerPageOptions={[10, 30, 50, 100]} component="div" count={totalCount} rowsPerPage={rowsPerPage} page={page} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} disabled={loading} />
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleUpdate} disabled={!permissions.canWrite}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Update</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteFromMenu} disabled={!permissions.canDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>
      <UploadDesignationsDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadSuccess={() => fetchMasterDesignations(debouncedSearchQuery, statusFilter, page, rowsPerPage)}
      />
      {deleteTarget && (
        <ConfirmationDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteAction}
          title="Confirm Deletion"
          description={`Are you sure you want to delete the designation "${deleteTarget.designation}" (${deleteTarget.id})? This action cannot be undone.`}
        />
      )}
      <UpdateDesignationDialog
        open={!!updateTarget}
        onClose={() => setUpdateTarget(null)}
        onSuccess={() => fetchMasterDesignations(debouncedSearchQuery, statusFilter, page, rowsPerPage)}
        designation={updateTarget}
      />
    </Box>
  );
};