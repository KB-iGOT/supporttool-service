import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { frameworkService } from '../../services/framework.service';

interface ExistingDesignation {
  code: string;
  name: string;
  refId: string;
}

interface ExistingDesignationsDialogProps {
  open: boolean;
  onClose: () => void;
  rootOrgId: string;
  designations: ExistingDesignation[];
}

export const ExistingDesignationsDialog: React.FC<ExistingDesignationsDialogProps> = ({ open, onClose, rootOrgId, designations }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [frameworkId, setFrameworkId] = useState<string | undefined>(undefined);

  // Fetch frameworkId from rootOrgId
  const fetchFrameworkId = useCallback(async () => {
    if (rootOrgId) {
      try {
        const response = await frameworkService.fetchFrameworkData(rootOrgId);
        const framework = response.result?.framework;
        setFrameworkId(framework?.identifier);
      } catch (error) {
        console.error("Error fetching framework ID:", error);
        setFrameworkId(undefined);
      }
    }
  }, [rootOrgId]);

  useEffect(() => {
    if (open) {
      fetchFrameworkId();
    }
  }, [open, fetchFrameworkId]);

  const filteredDesignations = useMemo(() => {
    if (!searchQuery) {
      return designations;
    }
    return designations.filter(
      (d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.refId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [designations, searchQuery]);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setPage(0);
      setRowsPerPage(10);
    }
  }, [open]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Existing Designations ({designations.length})</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <TextField
            fullWidth
            autoFocus
            label="Search Existing Designations"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name or Ref ID..."
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          />
        </Box>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Reference ID</TableCell><TableCell>Code</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredDesignations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((des) => (
                  <TableRow key={des.code}><TableCell>{des.name}</TableCell><TableCell>{des.refId}</TableCell><TableCell>{des.code}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredDesignations.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} />
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};