import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from '@mui/material/TablePagination';
import Paper from "@mui/material/Paper";
import { useEffect, useState, useRef } from "react";
import { contentsService } from "../../services/contents.service";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Alert, { AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { Content, Facets } from "../../types/contents";
import { FilterDrawer } from "./../common-components/filter-drawer";
import { FormControl, TextField, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import { EllipsisCell } from "../common-components/ellipsis-cell/ellipsis-cell";
import { AppContext } from "../../Context/AppContext";
import { appContextType } from "../../types";
import { useFormInterceptor } from "../../hooks/useFormsInterceptor";
import { useActionInterceptor } from "../../hooks/useActionInterceptor";
import { useLocation } from "react-router-dom";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SortIcon from '@mui/icons-material/Sort';

const filterConfig = {
  courseCategory: 'multi',
  resourceCategory: 'multi'
} as const;

export const Contents = () => {
  const location = useLocation();
  const moduleState = location.state;
  console.log("Module state:", moduleState, location.state);
  const [contents, setContents] = useState<Content[]>([]);
  const [contentsCount, setContentsCount] = useState<number>(0);
  const [facets, setFacets] = useState<Facets[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });

  const { modulePermissions } = React.useContext(
    AppContext,
  ) as appContextType;

  const { checkPermissions } = React.useContext(
    AppContext,
  ) as appContextType;

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);

  // Use ref to track if initial load is complete
  const initialLoadComplete = useRef(false);

  // Add new state for help dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Handler for search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Execute search when Enter key is pressed
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setPage(0); // Reset to first page when searching
      fetchContents(0, rowsPerPage, searchQuery, selectedFilters, false);
    }
  };

  const handleFilterChange = (filters: { [key: string]: string[] }) => {
    setSelectedFilters(filters);
    // Reset to first page when filters change
    setPage(0);
    // Call API with new filters but don't update facets
    fetchContents(0, rowsPerPage, searchQuery, filters, false);
  };

  const handleToastClose = () =>
    setToasts({ message: "", open: false, severity: undefined });

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (content: Content) => {
    setContentToDelete(content);
    setDeleteDialogOpen(true);
  };

  // Handle closing the delete confirmation dialog
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setContentToDelete(null);
  };

  // Handle confirming content deletion
  const deleteHandler = async (payload: any) => {
    console.log("Delete payload:", payload);
    if (!contentToDelete) return;

    setLoading(true);
    try {
      // Call the retire API
      console.log(moduleState);
      await contentsService.retireContent({...payload, module: moduleState?.name});
      
      // Show success message
      setToasts({
        message: `Content "${contentToDelete.name}" has been retired successfully.`,
        open: true,
        severity: "success"
      });

      // Refresh the content list
      fetchContents(page, rowsPerPage, searchQuery, selectedFilters, false);
    } catch (error) {
      console.error("Error retiring content:", error);
      setToasts({
        message: "Failed to retire content. Please try again.",
        open: true,
        severity: "error"
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    }
  };

  const { handleAction: handleDeleteAction } = useActionInterceptor({
    actionType: 'Delete',
    onComplete: deleteHandler,
    getPayload: () => ({identifier: contentToDelete?.identifier}),
  });

  const fetchContents = async (
    pageNumber = 0,
    pageSize = 10,
    query = "",
    filters: { [key: string]: string[] } = {},
    updateFacets = true // New parameter to control facet update
  ) => {
    setLoading(true);
    try {
      // Create the request payload with pagination parameters and filters
      const requestPayload = {
        locale: ["en"],
        request: {
          limit: pageSize,
          offset: pageNumber * pageSize,
          query: query,
          facets: ["courseCategory", "resourceCategory"],
          filters: {
            status: ["Live"],
            ...buildFilterPayload(filters)
          },
          sort_by: {
            lastUpdatedOn: "desc"
          }
        }
      };

      const data = await contentsService.getContent(requestPayload);
      if (data.result) {
        setContents(data.result.content || []);
        setContentsCount(data.result.count || 0);

        // Only update facets on initial load or when explicitly requested
        if (updateFacets) {
          setFacets(data.result.facets);
          initialLoadComplete.current = true;
        }
      }
    } catch (error) {
      console.error("Error fetching contents:", error);
      setToasts({
        message: "Failed to load contents",
        open: true,
        severity: "error",
      });
    }
    setLoading(false);
  };

  // Helper function to build filter payload from selected filters
  const buildFilterPayload = (filters: { [key: string]: string[] }) => {
    const payload: { [key: string]: string[] } = {};

    // Convert the filter structure to the format expected by the API
    Object.entries(filters).forEach(([filterName, values]) => {
      if (values && values.length > 0) {
        payload[filterName] = values;
      }
    });

    return payload;
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    fetchContents(newPage, rowsPerPage, searchQuery, selectedFilters, false);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
    fetchContents(0, newRowsPerPage, searchQuery, selectedFilters, false);
  };

  // Handle drawer close - don't fetch data again as filters are applied via handleFilterChange
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  // Filter selection handlers
  const handleFilterSelect = (event: SelectChangeEvent<string[]>, filterName: string) => {
    const values = event.target.value as string[];
    
    // Clear all filters and set only the current one if it has values
    if (values.length > 0) {
      setSelectedFilters({ [filterName]: values });
    } else {
      // If the user cleared all values in this filter, clear all filters
      setSelectedFilters({});
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchContents(0, rowsPerPage, searchQuery, selectedFilters, false);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    setPage(0);
    fetchContents(0, rowsPerPage, searchQuery, {}, false);
  };

  // Functions to handle the help dialog
  const handleHelpOpen = () => {
    setHelpDialogOpen(true);
  };

  const handleHelpClose = () => {
    setHelpDialogOpen(false);
  };

  useEffect(() => {
    // Initial load - update facets
    const permissions = checkPermissions();
    // console.log("Current module permissions:", permissions);
    try {
      fetchContents(page, rowsPerPage, searchQuery, selectedFilters, true);
    } catch (error) {
      // console.error("Error in initial data fetch:", error);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Box display="flex" alignItems={"center"} justifyContent="space-between" mb={2}>
            <div>
              <Typography variant="h4" component="h1" sx={{ margin: 0 }}>Contents</Typography>
              <Typography variant="body2">Contents Data goes here.</Typography>
            </div>
            <Tooltip title="Help">
              <IconButton 
                color="primary" 
                onClick={handleHelpOpen}
                sx={{ ml: 1 }}
              >
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormControl sx={{ width: "100%" }}>
                <TextField
                  autoComplete="off"
                  margin="dense"
                  id="searchContent"
                  name="searchContent"
                  label="Search Content"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleSearchKeyPress}
                  color="primary"
                />
              </FormControl>

              <Box display="flex" flexWrap="wrap" gap={2}>
                {facets && facets.map((facet) => (
                  facet.values && facet.values.length > 0 && (
                    <FormControl key={facet.name} sx={{ minWidth: 200, flex: 1 }}>
                      <InputLabel id={`${facet.name}-label`}>{facet.name}</InputLabel>
                      <Select
                        labelId={`${facet.name}-label`}
                        id={facet.name}
                        multiple
                        value={selectedFilters[facet.name] || []}
                        onChange={(e) => handleFilterSelect(e, facet.name)}
                        input={<OutlinedInput label={facet.name} />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                              <Chip key={value} label={value} />
                            ))}
                          </Box>
                        )}
                      >
                        {facet.values.map((option) => (
                          <MenuItem key={option.name} value={option.name}>
                            {option.name} ({option.count})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )
                ))}
              </Box>

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button variant="contained" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </Box>

              {Object.keys(selectedFilters).length > 0 && (
                <Box mt={1}>
                  <Typography variant="subtitle2" gutterBottom>Active Filters:</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {Object.entries(selectedFilters).map(([category, values]) => (
                      values && values.length > 0 ? (
                        values.map(value => (
                          <Chip
                            key={`${category}-${value}`}
                            label={`${category}: ${value}`}
                            onDelete={() => {
                              const updatedValues = selectedFilters[category].filter(v => v !== value);
                              setSelectedFilters(prev => ({
                                ...prev,
                                [category]: updatedValues
                              }));
                            }}
                          />
                        ))
                      ) : null
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {contents && contents.length > 0 ? (
            <>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ maxWidth: 250 }}>Name</TableCell>
                      <TableCell sx={{ maxWidth: 150 }}>Primary Category</TableCell>
                      <TableCell sx={{ maxWidth: 120 }}>Created On</TableCell>
                      <TableCell sx={{ maxWidth: 150 }}>Creator</TableCell>
                      <TableCell align="right" sx={{ width: 120 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contents && contents.map((row) => (
                      <TableRow
                        key={row.identifier}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            maxWidth: 250,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <EllipsisCell text={row.name} maxWidth={250} />
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 150,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {row.primaryCategory}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 120 }}>
                          {new Date(row.createdOn).toLocaleDateString()}
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 150,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {row.creator}
                        </TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>
                          {/* <IconButton
                            aria-label="edit"
                            size="small"
                            onClick={() => {}}
                          >
                            <PencilIcon fontSize="small" />
                          </IconButton> */}
                          {checkPermissions().canDelete && (
                            <Tooltip title="Retire Content">
                              <IconButton
                                aria-label="delete"
                                size="small"
                                onClick={() => handleDeleteClick(row)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table Pagination Component */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={contentsCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          ) : (
            <Alert severity="info">
              No contents available. Create one by clicking on add new content.
            </Alert>
          )}

          {/* Help Dialog */}
          <Dialog
            open={helpDialogOpen}
            onClose={handleHelpClose}
            aria-labelledby="help-dialog-title"
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle id="help-dialog-title">
              <Box display="flex" alignItems="center" gap={1}>
                <HelpOutlineIcon color="primary" />
                <Typography variant="h6">Content Management Help</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                This page allows you to manage content items. Here's what you can do:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SearchIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Search Content" 
                    secondary="Type keywords in the search box and press Enter to find specific content items."
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <FilterAltIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Filter Content" 
                    secondary="Use the filter dropdowns to narrow down content by category. Only one filter category can be active at a time."
                  />
                </ListItem>
                
                {checkPermissions().canDelete && (
                  <ListItem>
                    <ListItemIcon>
                      <DeleteOutlineIcon color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Retire Content" 
                      secondary="Click the trash icon to retire a content item. Retired content will no longer be available to users."
                    />
                  </ListItem>
                )}
                
                <ListItem>
                  <ListItemIcon>
                    <SortIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Pagination" 
                    secondary="Navigate between pages and adjust how many items are displayed per page using the controls at the bottom."
                  />
                </ListItem>
              </List>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Note: Content is sorted by last updated date by default, with the most recently updated items appearing first.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleHelpClose} variant="contained">
                Got it
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              Retire Content
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Are you sure you want to retire "{contentToDelete?.name}"?
                This action will make the content unavailable to users.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteAction} 
                color="error" 
                variant="contained" 
                autoFocus
                disabled={loading}
              >
                {loading ? "Retiring..." : "Yes, Retire"}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            open={toasts.open}
            autoHideDuration={6000}
            onClose={handleToastClose}
          >
            <Alert variant="filled" severity={toasts.severity}>
              {toasts.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </>
  );
};