import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { frameworkService } from '../../services/framework.service';

interface Association {
  identifier: string;
  code: string;
  name: string;
  refId: string;
  status: string;
  additionalProperties: {
    importedOn: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Category {
  code: string;
  terms: { associations: Association[] }[];
  [key: string]: any;
}

export const DesignationView: React.FC = () => {
  const { orgId, frameworkId } = useParams<{ orgId: string; frameworkId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designations, setDesignations] = useState<Association[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getFrameworkData = useCallback(async () => {
    if (!frameworkId) {
      setError('Framework ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await frameworkService.fetchFrameworkData(frameworkId);
      if (response.result?.framework?.categories) {
        const orgCategory = response.result.framework.categories.find(
          (cat: Category) => cat.code === 'org'
        );

        if (orgCategory?.terms?.[0]?.associations) {
          setDesignations(orgCategory.terms[0].associations);
        } else {
          setDesignations([]); // Set to empty array if no associations found
        }
      } else {
        throw new Error('Invalid framework data response');
      }
    } catch (err) {
      console.error('Error fetching framework data:', err);
      setError('Failed to fetch designation details.');
    } finally {
      setLoading(false);
    }
  }, [frameworkId]);

  useEffect(() => {
    getFrameworkData();
  }, [getFrameworkData]);

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

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleImportClick = () => {
    navigate(`/organisations/designations/import/${orgId}/${frameworkId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Existing Designations
        </Typography>
        <Chip label={`Total: ${designations.length}`} color="primary" />
      </Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Organisation: {orgId}
      </Typography>      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Framework ID: {frameworkId}
      </Typography>

      <Paper sx={{ p: 2, my: 3 }}>
        <TextField
          fullWidth
          label="Search Designations"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Name or Ref ID..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper elevation={3}>
        {filteredDesignations.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Ref ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Imported On</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDesignations
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((des) => (
                    <TableRow key={des.identifier}>
                      <TableCell>{des.name}</TableCell>
                      <TableCell>{des.refId}</TableCell>
                      <TableCell>
                        <Chip label={des.status} color={des.status === 'Live' ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>{des.additionalProperties?.importedOn || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredDesignations.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography>No designations found.</Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleImportClick}
            >
              Import Designation
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};