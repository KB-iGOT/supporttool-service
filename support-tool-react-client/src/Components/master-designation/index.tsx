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
} from '@mui/material';
import Button from '@mui/material/Button';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import { designationService } from '../../services/designations.service';
import { useDebounce } from '../../hooks/useDebounce';
import { AppContext } from '../../Context/AppContext';
import { appContextType } from '../../types';
import { UploadDesignationsDialog } from './UploadDesignationsDialog';
// This interface is based on the one in ImportDesignationsPage.tsx
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { checkPermissions } = React.useContext(AppContext) as appContextType;
  const permissions = checkPermissions('/master-designations');

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchMasterDesignations = useCallback(async (query: string, currentPage: number, pageSize: number) => {
    setLoading(true);
    setError(null);
    try {
      const masterRes = await designationService.searchMasterDesignations(query, currentPage, pageSize);
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
  }, [debouncedSearchQuery]);

  useEffect(() => {
    fetchMasterDesignations(debouncedSearchQuery, page, rowsPerPage);
  }, [debouncedSearchQuery, page, rowsPerPage, fetchMasterDesignations]); // page will be updated by the effect above

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Master Designations
        </Typography>
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
      <Paper elevation={3}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="Search Designations"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
            }}
          />
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
                </TableRow>
              </TableHead>
              <TableBody>
                {masterDesignations.map((des) => (
                  <TableRow key={des.id}>
                    <TableCell>{des.designation}</TableCell>
                    <TableCell>{des.description || 'N/A'}</TableCell>
                    <TableCell><Chip label={des.status} size="small" color={des.status === 'Live' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{des.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination rowsPerPageOptions={[10, 30, 50, 100]} component="div" count={totalCount} rowsPerPage={rowsPerPage} page={page} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} disabled={loading} />
      </Paper>
      <UploadDesignationsDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadSuccess={() => fetchMasterDesignations(debouncedSearchQuery, page, rowsPerPage)}
      />
    </Box>
  );
};