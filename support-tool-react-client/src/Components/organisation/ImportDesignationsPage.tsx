import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Button,
  Snackbar,
  TablePagination,
  Grid,
  IconButton,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { frameworkService } from '../../services/framework.service';
import { v4 as uuidv4 } from 'uuid';
import { useDebounce } from '../../hooks/useDebounce';
import { AppContext, useActionIntercept } from '../../Context/AppContext';
import { designationService } from '../../services/designations.service'; 
import { ExistingDesignationsDialog } from './ExistingDesignationsDialog';
import { appContextType } from '../../types';

interface MasterDesignation {
  name: string;
  id: string;
  description: string;
  status: string;
  designation:string;
}

interface ExistingDesignation {
  code: string;
  name: string;
  identifier: string;
  refId:string;
}

export const ImportDesignationsPage: React.FC = () => {
  const { orgId, frameworkId } = useParams<{ orgId: string; frameworkId: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AppContext) as appContextType;
  const { interceptAction } = useActionIntercept();

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [masterDesignations, setMasterDesignations] = useState<MasterDesignation[]>([]);
  const [existingDesignations, setExistingDesignations] = useState<Set<string>>(new Set());
  const [existingDesignationList, setExistingDesignationList] = useState<ExistingDesignation[]>([]);
  const [orgCategory, setOrgCategory] = useState<any>(null);
  const [selectedToImport, setSelectedToImport] = useState<Set<MasterDesignation>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [totalCount, setTotalCount] = useState(0);
  const [existingDesignationsDialogOpen, setExistingDesignationsDialogOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchFramework = useCallback(async () => {
    if (!frameworkId) return;
    try {
      const frameworkRes = await frameworkService.fetchFrameworkData(frameworkId);
      if (frameworkRes.result?.framework?.categories) {
        const foundOrgCategory = frameworkRes.result.framework.categories.find(
          (cat: any) => cat.code === 'org'
        );
        setOrgCategory(foundOrgCategory || null);
        if (foundOrgCategory?.terms?.[0]?.associations) {
          const associations = foundOrgCategory.terms[0].associations;
          setExistingDesignationList(associations);
          const existingCodes: any = new Set(
            associations.map((assoc: ExistingDesignation) => assoc.refId)
          );
          setExistingDesignations(existingCodes);
        } else {
          setExistingDesignationList([]);
        }
      }
    } catch (err) {
      console.error('Error fetching framework data:', err);
      setError((prev) => (prev ? prev + ' And failed to load framework data.' : 'Failed to load framework data.'));
    }
  }, [frameworkId]);

  const fetchMasterDesignations = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const masterRes = await designationService.searchMasterDesignations(query, page, rowsPerPage);
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
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (frameworkId) {
      fetchFramework();
    } else {
      setError('Framework ID is missing.');
      setLoading(false);
    }
  }, [frameworkId, fetchFramework]);

  useEffect(() => {
    // Reset to page 0 whenever the search query changes
    setPage(0);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (frameworkId) {
      fetchMasterDesignations(debouncedSearchQuery);
    } // The fetch is dependent on `page`, which is updated by the effect above
  }, [debouncedSearchQuery, page, rowsPerPage, frameworkId, fetchMasterDesignations]);

  const handleToggle = (value: MasterDesignation) => () => {
    const newSelected = new Set(selectedToImport);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setSelectedToImport(newSelected);
  };

  const handleImport = async () => {
    if (selectedToImport.size === 0 || !frameworkId || !orgId) return;

    const designationsToImport = Array.from(selectedToImport);
    const actionPayload = { frameworkId, orgId, count: designationsToImport.length };

    interceptAction('DESIGNATION_IMPORT', actionPayload, async (auditData: any) => {
      setImporting(true);
      setError(null);
      try {
        const newAssociations: { identifier: string }[] = [];
        const importedOnDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        for (const des of designationsToImport) {
            const requestPayload = {
            name: des.designation,
                "code": uuidv4(),
                "description": "",
                "refId": des.id,
                "refType": "designation",
                "category": "designation",
                "status": "Live",
                "framework": frameworkId,
                additionalProperties: {
                    importedByName: user?.userName || "Support Tool User",
                    importedById: user?.userId || "N/A",
                    importedOn: importedOnDate,
                    previousCategoryCode: orgCategory?.code || "org",
                    previousTermCode: orgCategory?.terms?.[0]?.code || "N/A",
                    timeStamp: new Date().getTime(),
                }
            };
          const createPayload = {
            requestPayload,
            ...auditData,
          };
          const response = await designationService.createDesignation(createPayload);
          if (response.result?.node_id && response.result?.node_id[0]) {
            newAssociations.push({ identifier: response.result.node_id[0] });
          }
        }


        const termCode = orgCategory?.terms?.[0]?.code;
        const category = orgCategory?.terms?.[0]?.category

        if (termCode) {
          const existingAssociations = orgCategory?.terms?.[0]?.associations?.map((assoc: any) => ({ identifier: assoc.identifier })) || [];
          const allAssociations = [...existingAssociations, ...newAssociations];
          if (allAssociations.length > 0) {
            await frameworkService.updateTermAssociationsV2(frameworkId!, termCode, category, allAssociations, auditData);
          }
          
          // Add a delay to allow backend to process the term update before publishing
          await new Promise(resolve => setTimeout(resolve, 3000));

          await frameworkService.publishFramework(frameworkId!, auditData);
        }

        setNotification({ open: true, message: `${designationsToImport.length} designation(s) imported and published successfully!` });
        setSelectedToImport(new Set());
        await fetchFramework();

      } catch (err: any) {
        console.error('Error importing designations:', err);
        setError(err?.response?.data?.message || 'Failed to import and publish designations.');
      } finally {
        setImporting(false);
      }
    });
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRemoveFromSelected = (designation: MasterDesignation) => {
    const newSelected = new Set(selectedToImport);
    newSelected.delete(designation);
    setSelectedToImport(newSelected);
  };

  const selectedArray = Array.from(selectedToImport);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Import Designations
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Organisation ID: {orgId}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Left Panel: Available Designations */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #ccc' }}>
              <Typography variant="h6" gutterBottom>Available Designations</Typography>
              <TextField
                fullWidth
                label="Search Master Designations"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                }}
              />
            </Box>

            <Box sx={{ p: 2, borderBottom: '1px solid #ccc' }}>
              <Button onClick={() => setExistingDesignationsDialogOpen(true)}>
                View Existing Designations
                <Chip label={existingDesignationList.length} size="small" sx={{ ml: 1 }} />
              </Button>
            </Box>

            {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
              ) : (
                <List dense>
                  {masterDesignations.map((des) => {
                    const isExisting = existingDesignations.has(des.id);
                    const isSelected = selectedToImport.has(des);
                    return (
                      <ListItem key={des.id} secondaryAction={<div />} disablePadding>
                        <ListItemButton onClick={handleToggle(des)} disabled={isExisting}>
                          <ListItemIcon>
                            <Checkbox edge="start" checked={isSelected} tabIndex={-1} disableRipple disabled={isExisting} />
                          </ListItemIcon>
                          <ListItemText primary={des.designation} secondary={des.description || `ID: ${des.id}`} />
                          {isExisting && <Typography variant="caption" color="text.secondary">Already added</Typography>}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
            <TablePagination
              rowsPerPageOptions={[10, 30, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              disabled={loading}
            />
          </Paper>
        </Grid>

        {/* Right Panel: Selected for Import */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #ccc' }}>
              <Typography variant="h6">Selected for Import ({selectedArray.length})</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {selectedArray.length > 0 ? (
                <List dense>
                  {selectedArray.map((des) => (
                    <ListItem
                      key={des.id}
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFromSelected(des)}>
                          <ClearIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={des.designation} secondary={`ID: ${des.id}`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography>No designations selected.</Typography>
                  <Typography variant="body2">Select from the list on the left to import.</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ p: 2, borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="text" onClick={() => navigate(-1)} sx={{ mr: 2 }}>Cancel</Button>
              <Button onClick={handleImport} variant="contained" disabled={importing || selectedToImport.size === 0}>
                {importing ? <CircularProgress size={24} /> : `Import Selected`}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
      />

      <ExistingDesignationsDialog
        open={existingDesignationsDialogOpen}
        onClose={() => setExistingDesignationsDialogOpen(false)}
        designations={existingDesignationList}
      />
    </>
  );
};