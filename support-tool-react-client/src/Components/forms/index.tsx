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
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Alert, { AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { UserProfile } from "../../types/users";
import { FilterDrawer } from "./../common-components/filter-drawer";
import { FormControl, TextField, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { formsService } from "../../services/forms.service";

const filterConfig = {
  courseCategory: 'multi',
  resourceCategory: 'multi'
} as const;

const FACETS_LIST = ["rootOrgName"]

export const Forms = () => {
  const [forms, setForms] = useState<UserProfile[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [facets, setFacets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use ref to track if initial load is complete
  const initialLoadComplete = useRef(false);

  // Handler for search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Execute search when Enter key is pressed
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setPage(0); // Reset to first page when searching
      fetchUsers(0, rowsPerPage, searchQuery, selectedFilters, false);
    }
  };

  const handleFilterChange = (filters: { [key: string]: string[] }) => {
    setSelectedFilters(filters);
    // Reset to first page when filters change
    setPage(0);
    // Call API with new filters but don't update facets
    fetchUsers(0, rowsPerPage, searchQuery, filters, false);
  };

  const handleToastClose = () =>
    setToasts({ message: "", open: false, severity: undefined });

  const fetchUsers = async (
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
            "request": {
                "fields": [],
                facets: FACETS_LIST,
                "limit": pageSize, 
                query: query,
                filters: {
                    status: 1,
                    ...buildFilterPayload(filters)
                  },
                "offset": pageNumber * pageSize,
            }
        };
      
      const data = await formsService.getForms(requestPayload);
      if (data.result) {
        setForms(data.result.response.content || []);
        setUsersCount(data.result.response.count || 0);
        
        // Only update facets on initial load or when explicitly requested
        if (updateFacets) {
          setFacets(data.result.response.facets);
          initialLoadComplete.current = true;
        }
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      setToasts({
        message: "Failed to load forms",
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
    fetchUsers(newPage, rowsPerPage, searchQuery, selectedFilters, false);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    debugger
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
    fetchUsers(0, newRowsPerPage, searchQuery, selectedFilters, false);
  };

  // Handle drawer close - don't fetch data again as filters are applied via handleFilterChange
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    // Initial load - update facets
    try {
      fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, true);
    } catch (error) {
      console.error("Error in initial data fetch:", error);
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
                <Typography variant="h4" component="h1" sx={{ margin: 0 }}>Forms</Typography>
                <Typography variant="body2">Forms Data goes here.</Typography>                
            </div>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
            >
              Add new user
            </Button>
          </Box>

          <div className="bg-gray-100 p-4">
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <FormControl sx={{ flexGrow: 1 }}>
                  <TextField
                    autoComplete="off"
                    margin="dense"
                    id="searchUsers"
                    name="searchUsers"
                    label="Search Users"
                    type="text"
                    fullWidth
                    variant="filled"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleSearchKeyPress}
                    color="primary"
                    InputProps={{
                        endAdornment: searchQuery ? (
                          <IconButton
                            aria-label="clear search"
                            onClick={() => {
                              setSearchQuery("");
                              setPage(0);
                              fetchUsers(0, rowsPerPage, "", selectedFilters, false);
                            }}
                            edge="end"
                          >
                            <ClearIcon />
                          </IconButton>
                        ) : null,
                      }}
                    sx={{
                      backgroundColor: "white",
                      borderRadius: "4px",
                      '& .MuiFilledInput-root': {
                        backgroundColor: "white",
                        '&:hover': {
                          backgroundColor: "white",
                          opacity: 0.9
                        },
                        '&.Mui-focused': {
                          backgroundColor: "white"
                        }
                      }
                    }}
                  />
                </FormControl>
                <Button
                  variant="contained"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  Open Filters
                </Button>
              </Box>
              
              {Object.keys(selectedFilters).length > 0 && (
                <Box mt={2} p={2} bgcolor="white" borderRadius={1} boxShadow={1}>
                  <Typography variant="subtitle2" gutterBottom>Active Filters:</Typography>
                  {Object.entries(selectedFilters).map(([category, values]) => (
                    values && values.length > 0 ? (
                      <Box key={category} mb={1}>
                        <strong>{category}:</strong> {values.join(", ")}
                      </Box>
                    ): null
                  ))}
                </Box>
              )}

              <FilterDrawer
                open={isDrawerOpen}
                onClose={handleDrawerClose}
                facets={facets}
                filterConfig={filterConfig}
                onFilterChange={handleFilterChange}
                initialFilters={selectedFilters}
              />
          </div>
          
          {forms && forms.length > 0 ? (
            <>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Org name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forms && forms.map((row) => (
                      <TableRow
                        key={row.identifier}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {row.firstName}
                        </TableCell>
                        <TableCell>{row.rootOrgName}</TableCell>
                        <TableCell>{row?.profileDetails?.personalDetails?.primaryEmail || '-'}</TableCell>
                        <TableCell>{row?.profileDetails?.profileStatus || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label="edit"
                            size="small"
                            onClick={() => {}}  
                          >
                            <PencilIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            aria-label="delete"
                            size="small"
                            onClick={() => {}}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
                count={usersCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          ) : (
            <Alert severity="info">
              No forms available. Create one by clicking on add new user.
            </Alert>
          )}
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