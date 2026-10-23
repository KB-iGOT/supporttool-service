import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Button,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import { organisationService } from '../../services/organisations.service';
import { contentsService } from '../../services/contents.service';
import { AppContext, useActionIntercept } from '../../Context/AppContext';
import { appContextType } from '../../types';
import { Facets } from '../../types/contents';
import { useDebounce } from '../../hooks/useDebounce';

// Only course-like content can be mapped to an organisation's eligibility list
const COURSE_PRIMARY_CATEGORIES = ['Course', 'Program', 'Blended Program', 'Curated Program'];

interface ContentItem {
  identifier: string;
  name?: string;
  courseCategory?: string;
  primaryCategory?: string;
  status?: string;
  [key: string]: any;
}

interface Eligibility {
  courseIds: string[];
  version: number;
}

const extractContents = (result: any): ContentItem[] => [
  ...(result?.content || []),
  ...(result?.QuestionSet || []),
];

export const OrgEligibilityContents: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const orgName: string | undefined = (location.state as any)?.orgName;
  const { setNotification } = useContext(AppContext) as appContextType;
  const { interceptAction } = useActionIntercept();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility>({ courseIds: [], version: 1 });
  const [contentDetails, setContentDetails] = useState<Record<string, ContentItem>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchContentDetails = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setContentDetails({});
      return;
    }
    const data = await contentsService.getContent({
      request: {
        filters: { identifier: ids, status: ['Live', 'Retired'] },
        limit: ids.length,
      },
    });
    const details: Record<string, ContentItem> = {};
    extractContents(data?.result).forEach((c) => {
      details[c.identifier] = c;
    });
    setContentDetails(details);
  }, []);

  const fetchEligibility = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      let courseIds: string[] = [];
      let version = 1;
      try {
        const response = await organisationService.fetchOrgEligibility(orgId);
        courseIds = response?.result?.courseIds || [];
        version = response?.result?.version ?? 1;
      } catch (err: any) {
        // No eligibility record yet for this org
        if (err?.response?.status !== 404) throw err;
      }
      setEligibility({ courseIds, version });
      await fetchContentDetails(courseIds);
    } catch (err) {
      console.error('Error fetching org eligibility contents:', err);
      setError('Failed to fetch organisation contents');
    } finally {
      setLoading(false);
    }
  }, [orgId, fetchContentDetails]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  // Step back a page if removals emptied the current one
  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= eligibility.courseIds.length) {
      setPage(Math.max(0, Math.ceil(eligibility.courseIds.length / rowsPerPage) - 1));
    }
  }, [eligibility.courseIds.length, page, rowsPerPage]);

  const saveCourseIds =(courseIds: string[], successMessage: string) => {
    if (!orgId) return;
    const payload = {
      orgId,
      courseIds,
      courseCount: courseIds.length,
      version: eligibility.version,
      updatedAt: new Date().toISOString(),
    };

    interceptAction('UPSERT_ORG_ELIGIBILITY', {}, async (auditData: any) => {
      try {
        setLoading(true);
        await organisationService.upsertOrgEligibility({
          payload,
          jiraLink: auditData.jiraLink,
          changedFields: {
            courseIds: { original: eligibility.courseIds, new: courseIds },
          },
          module: 'Organisation Management',
        });
        setNotification({ open: true, message: successMessage, severity: 'success' });
        setAddDialogOpen(false);
        await fetchEligibility();
      } catch (err: any) {
        console.error('Error updating org eligibility contents:', err);
        setNotification({
          open: true,
          message: err?.response?.data?.responseMessage || 'Failed to update organisation contents',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const handleAddContents = (ids: string[]) => {
    const merged = Array.from(new Set([...eligibility.courseIds, ...ids]));
    saveCourseIds(merged, `${ids.length} content(s) added successfully`);
  };

  const handleRemoveContent = (id: string) => {
    saveCourseIds(
      eligibility.courseIds.filter((c) => c !== id),
      'Content removed successfully'
    );
  };

  const pagedIds = eligibility.courseIds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ pt: 3, pb: 5 }}>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/organisations')} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{orgName ? `${orgName} - Contents` : 'Organisation Contents'}</Typography>
          <Typography variant="body2" color="text.secondary">
            Org ID: {orgId} · {eligibility.courseIds.length} content(s) mapped
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)} disabled={loading}>
          Add Contents
        </Button>
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
                <TableCell>Content Name</TableCell>
                <TableCell>Identifier</TableCell>
                <TableCell>Course Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedIds.map((id) => {
                const content = contentDetails[id];
                return (
                  <TableRow key={id} hover>
                    <TableCell>
                      {content?.name || (
                        <Typography variant="body2" color="text.secondary">
                          Details not found
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{id}</TableCell>
                    <TableCell>
                      <Chip label={content?.courseCategory || content?.primaryCategory || 'N/A'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={content?.status || 'N/A'}
                        color={content?.status === 'Live' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Remove content">
                        <IconButton size="small" onClick={() => handleRemoveContent(id)} disabled={loading}>
                          <DeleteOutlineIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && eligibility.courseIds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No contents mapped to this organisation
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={eligibility.courseIds.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <AddContentsDialog
        open={addDialogOpen}
        existingIds={eligibility.courseIds}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddContents}
      />
    </Box>
  );
};

interface AddContentsDialogProps {
  open: boolean;
  existingIds: string[];
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}

const AddContentsDialog: React.FC<AddContentsDialogProps> = ({ open, existingIds, onClose, onAdd }) => {
  const [loading, setLoading] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<Facets[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, ContentItem>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const debouncedQuery = useDebounce(searchQuery, 500);
  const existingSet = useMemo(() => new Set(existingIds), [existingIds]);

  // Reset dialog state each time it is opened
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedCategories([]);
      setSelected({});
      setPage(0);
      setFacets([]);
    }
  }, [open]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, selectedCategories]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const search = async () => {
      setLoading(true);
      try {
        const query = debouncedQuery.trim();
        const filters: any = {
          status: ['Live'],
          primaryCategory: COURSE_PRIMARY_CATEGORIES,
        };
        if (selectedCategories.length > 0) {
          filters.courseCategory = selectedCategories;
        }
        // Allow pasting a do_id directly into the search box
        const isIdentifier = query.startsWith('do_');
        if (isIdentifier) {
          filters.identifier = query;
        }

        const data = await contentsService.getContent({
          locale: ['en'],
          request: {
            limit: rowsPerPage,
            offset: page * rowsPerPage,
            query: isIdentifier ? '' : query,
            facets: ['courseCategory'],
            filters,
            fields: ['name', 'identifier', 'courseCategory', 'primaryCategory', 'status', 'organisation'],
            sort_by: { lastUpdatedOn: 'desc' },
          },
        });
        if (cancelled) return;
        setContents(extractContents(data?.result));
        setTotalCount(data?.result?.count || 0);
        // Keep the category options stable once a category filter is applied
        if (selectedCategories.length === 0 && data?.result?.facets) {
          setFacets(data.result.facets);
        }
      } catch (err) {
        console.error('Error searching contents:', err);
        if (!cancelled) {
          setContents([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    search();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery, selectedCategories, page, rowsPerPage]);

  const categoryOptions = facets.find((f) => f.name === 'courseCategory')?.values || [];
  const selectedIds = Object.keys(selected);

  const toggleSelect = (content: ContentItem) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[content.identifier]) {
        delete next[content.identifier];
      } else {
        next[content.identifier] = content;
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Contents</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Search Contents"
            placeholder="Search by name or paste a do_id"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="course-category-label">Course Category</InputLabel>
            <Select
              labelId="course-category-label"
              multiple
              value={selectedCategories}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
              }}
              input={<OutlinedInput label="Course Category" />}
              renderValue={(values) => (values as string[]).join(', ')}
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.name} value={option.name}>
                  <Checkbox size="small" checked={selectedCategories.includes(option.name)} />
                  {option.name} ({option.count})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedIds.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {selectedIds.map((id) => (
              <Chip
                key={id}
                size="small"
                color="primary"
                label={selected[id].name || id}
                onDelete={() => toggleSelect(selected[id])}
              />
            ))}
          </Box>
        )}

        {loading && <LinearProgress sx={{ mb: 1 }} />}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Content Name</TableCell>
                <TableCell>Identifier</TableCell>
                <TableCell>Course Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contents.map((content) => {
                const alreadyAdded = existingSet.has(content.identifier);
                return (
                  <TableRow
                    key={content.identifier}
                    hover={!alreadyAdded}
                    onClick={() => !alreadyAdded && toggleSelect(content)}
                    sx={{ cursor: alreadyAdded ? 'default' : 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={alreadyAdded || Boolean(selected[content.identifier])}
                        disabled={alreadyAdded}
                      />
                    </TableCell>
                    <TableCell>
                      {content.name}
                      {alreadyAdded && <Chip label="Already added" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{content.identifier}</TableCell>
                    <TableCell>{content.courseCategory || content.primaryCategory || 'N/A'}</TableCell>
                  </TableRow>
                );
              })}
              {!loading && contents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No contents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={selectedIds.length === 0} onClick={() => onAdd(selectedIds)}>
          Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}Content(s)
        </Button>
      </DialogActions>
    </Dialog>
  );
};
