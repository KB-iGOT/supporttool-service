import * as React from "react";
import { useEffect, useState, useRef } from "react";
import {
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Paper,
  LinearProgress,
  IconButton,
  Button,
  Alert,
  AlertColor,
  Snackbar,
  FormControl,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  InputAdornment,
  SelectChangeEvent
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { UserProfile } from "../../types/users";
import { FilterDrawer } from "./../common-components/filter-drawer";
import { usersService } from "../../services/users.service";
import { DynamicFormDialog } from "../common-components/dynamic-form-dialog/DynamicFormDialog";
import { FieldDefinition, FormData as CustomFormData } from "../../types/forms";
import { getNestedValue } from "../../utils/pathResolver";

// Configuration constants
const FACETS_LIST = ["rootOrgName"];
const filterConfig = {
  courseCategory: 'multi',
  resourceCategory: 'multi'
} as const;

// Search field type definitions
type SearchFieldType = 'name' | 'email' | 'phone';

interface SearchFieldConfig {
  type: SearchFieldType;
  label: string;
  placeholder: string;
  path: string;
  icon: React.ReactNode;
}

const searchFields: Record<SearchFieldType, SearchFieldConfig> = {
  name: {
    type: 'name',
    label: 'Name',
    placeholder: 'Enter user name',
    path: 'profileDetails.personalDetails.firstname',
    icon: <PersonIcon />
  },
  email: {
    type: 'email',
    label: 'Email',
    placeholder: 'Enter user email',
    path: 'profileDetails.personalDetails.primaryEmail',
    icon: <EmailIcon />
  },
  phone: {
    type: 'phone',
    label: 'Phone Number',
    placeholder: 'Enter user phone number',
    path: 'profileDetails.personalDetails.mobile',
    icon: <PhoneIcon />
  }
};

const sampleFields: FieldDefinition[] = [
  {
    identifier: 'firstname',
    name: 'firstname',
    displayName: 'Name',
    fieldType: 'text',
    optional: false,
    selected: true,
    order: 1,
    placeholder: 'Enter first name',
    fieldPath: 'profileDetails.personalDetails.firstname',
    validation: {
      minLength: 2,
      maxLength: 50,
      pattern: '^[A-Za-z\\s]+$',
      errorMessage: 'Please enter a valid name (letters only)'
    }
  },
  {
    identifier: 'email',
    name: 'email',
    displayName: 'Email',
    fieldType: 'email',
    optional: false,
    selected: true,
    order: 2,
    placeholder: 'Enter email address',
    fieldPath: 'profileDetails.personalDetails.primaryEmail',
    validation: {
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      errorMessage: 'Please enter a valid email address'
    }
  },
  {
    identifier: 'phone',
    name: 'phone',
    displayName: 'Phone Number',
    fieldType: 'tel',
    optional: false,
    selected: true,
    order: 3,
    placeholder: 'Enter phone number',
    fieldPath: 'profileDetails.personalDetails.mobile',
    validation: {
      minLength: 10,
      maxLength: 15,
      pattern: '^\\+?[0-9]{10,15}$',
      errorMessage: 'Please enter a valid phone number (10-15 digits, may include + prefix)'
    }
  }
];

export const Users = () => {
  // State declarations
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [facets, setFacets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchFieldType>('name');
  const [open, setOpen] = useState(false);
  const [modifiedFields, setModifiedFields] = useState<Record<string, any>>({});
  const [editUserData, setEditUserData] = useState<Record<string, any>>({});
  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });
  
  // Refs
  const initialLoadComplete = useRef(false);

  // API and data fetching functions
  const fetchUsers = async (
    pageNumber = 0, 
    pageSize = 10, 
    query = "", 
    filters: { [key: string]: string[] } = {},
    updateFacets = true
  ) => {
    setLoading(true);
    try {
      // Build the filter object based on search type and query
      let searchFilters = { ...filters };
      
      // Only add search filter if there's a query
      if (query.trim()) {
        const searchPath = searchFields[searchType].path;
        searchFilters = {
          ...searchFilters,
          [searchPath]: [query.trim()]  // Wrap in array to match expected type
        };
      }
      
      const requestPayload = {
        request: {
          fields: [],
          facets: FACETS_LIST,
          limit: pageSize,
          filters: {
            status: 1,
            ...buildFilterPayload(searchFilters)
          },
          offset: pageNumber * pageSize,
        },
        query: ""
      };
      
      const data = await usersService.getUsers(requestPayload);
      if (data.result) {

        
        if (updateFacets) {
          setFacets(data.result.response.facets || []);
          initialLoadComplete.current = true;
        } else {

          setUsers(data.result.response.content || []);
          setUsersCount(data.result.response.count || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setToasts({
        message: "Failed to load users",
        open: true,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to build filter payload
  const buildFilterPayload = (filters: any) => {
    const payload: any = {};
    
    // Handle standard array-based filters
    Object.entries(filters).forEach(([filterName, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        payload[filterName] = values;
      } else if (typeof values === 'string' && values) {
        // Handle string-based filters (for search queries)
        payload[filterName] = values;
      }
    });
    
    return payload;
  };

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleSearchTypeChange = (event: SelectChangeEvent) => {
    setSearchType(event.target.value as SearchFieldType);
    // Clear search query when changing search type
    setSearchQuery("");
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchUsers(0, rowsPerPage, searchQuery, selectedFilters, false);
  };

  const handleFilterChange = (filters: { [key: string]: string[] }) => {
    setSelectedFilters(filters);
    setPage(0);
    fetchUsers(0, rowsPerPage, searchQuery, filters, false);
  };

  const handleToastClose = () => {
    setToasts({ message: "", open: false, severity: undefined });
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage, rowsPerPage, searchQuery, selectedFilters, false);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchUsers(0, newRowsPerPage, searchQuery, selectedFilters, false);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(0);
    fetchUsers(0, rowsPerPage, "", selectedFilters, false);
  };

  const handleEditUser = (user: Record<string, any>) => {
    setEditUserData(user);
    setOpen(true);
  };

  // Submit handler for user updates
  const handleSubmit = async (data: CustomFormData) => {
    try {
      setLoading(true);
      
      // Track field changes
      const changedFields: Record<string, any> = {};
      const updatePayload: Record<string, any> = {};
      
      sampleFields.forEach(field => {
        const newValue = field.fieldPath ? 
          getNestedValue(data, field.fieldPath) : 
          data.get(field.identifier);
        
        const originalValue = field.fieldPath ? 
          getNestedValue(editUserData, field.fieldPath) : 
          editUserData[field.identifier];

        // Only process changed fields
        if (String(newValue) !== String(originalValue)) {
          // For display
          changedFields[field.displayName] = {
            original: originalValue ?? '',
            new: newValue ?? ''
          };
          
          // For API update
          if (field.fieldPath) {
            const pathParts = field.fieldPath.split('.');
            let current = updatePayload;
            
            for (let i = 0; i < pathParts.length - 1; i++) {
              const part = pathParts[i];
              current[part] = current[part] || {};
              current = current[part];
            }
            
            current[pathParts[pathParts.length - 1]] = newValue;
          } else {
            updatePayload[field.identifier] = newValue;
          }
        }
      });

      setModifiedFields(changedFields);
      
      // Stop if no changes
      if (Object.keys(changedFields).length === 0) {
        setToasts({
          message: "No changes were made",
          open: true,
          severity: "info",
        });
        setOpen(false);
        return;
      }
      
      // Update user
      const userId = editUserData.identifier;
      const response : any= await usersService.updateUser(userId, updatePayload);
      
      if (response && response.responseCode === "OK") {
        setToasts({
          message: "User updated successfully",
          open: true,
          severity: "success",
        });
        
        fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, false);
        setOpen(false);
      } else {
        throw new Error(response?.responseMessage || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setToasts({
        message: error instanceof Error ? error.message : "An error occurred while updating user",
        open: true,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    try {
      // Initial load - just get users without search query
      fetchUsers(page, rowsPerPage, "", {}, true);
    } catch (error) {
      console.error("Error in initial data fetch:", error);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render components
  return (
    <>
      {loading && <LinearProgress />}
      
      <Box sx={{ position: 'relative' }}>
        {/* Header Section */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <div>
            <Typography variant="h4" component="h1" sx={{ margin: 0 }}>User Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Search for users by name, email, or phone number
            </Typography>                
          </div>
          {/* <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add new user
          </Button> */}
        </Box>

        {/* Search Panel */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Search Users</Typography>
          
          <Grid container spacing={2} alignItems="center">
            {/* Search Type Dropdown */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id="search-type-label">Search By</InputLabel>
                <Select
                  labelId="search-type-label"
                  id="search-type-select"
                  value={searchType}
                  label="Search By"
                  onChange={handleSearchTypeChange}
                >
                  <MenuItem value="name">
                    <Box display="flex" alignItems="center">
                      <PersonIcon sx={{ mr: 1 }} /> Name
                    </Box>
                  </MenuItem>
                  <MenuItem value="email">
                    <Box display="flex" alignItems="center">
                      <EmailIcon sx={{ mr: 1 }} /> Email
                    </Box>
                  </MenuItem>
                  <MenuItem value="phone">
                    <Box display="flex" alignItems="center">
                      <PhoneIcon sx={{ mr: 1 }} /> Phone Number
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Search Text Field */}
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth
                label={searchFields[searchType].label}
                placeholder={searchFields[searchType].placeholder}
                variant="outlined"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searchFields[searchType].icon}
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={handleClearSearch}
                        aria-label="clear search"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
            </Grid>
            
            {/* Search Button */}
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </Grid>
            
            {/* Filter Button */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  Advanced Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {/* Active Search Display */}
          {searchQuery && (
            <Box mt={2}>
              <Alert severity="info">
                Searching for {searchType}: <strong>{searchQuery}</strong>
              </Alert>
            </Box>
          )}
        </Paper>
            
        {/* Active Filters Display */}
        {Object.keys(selectedFilters).length > 0 && (
          <Box mt={2} p={2} mb={3} bgcolor="white" borderRadius={1} boxShadow={1}>
            <Typography variant="subtitle2" gutterBottom>Active Filters:</Typography>
            {Object.entries(selectedFilters).map(([category, values]) => (
              values && values.length > 0 ? (
                <Box key={category} mb={1}>
                  <strong>{category}:</strong> {values.join(", ")}
                </Box>
              ) : null
            ))}
          </Box>
        )}

        {/* Filter Drawer */}
        <FilterDrawer
          open={isDrawerOpen}
          onClose={handleDrawerClose}
          facets={facets}
          filterConfig={filterConfig}
          onFilterChange={handleFilterChange}
          initialFilters={selectedFilters}
        />
        
        {/* Results Section */}
        <Paper elevation={2}>
          {/* Users Table or Empty State */}
          {users && users.length > 0 ? (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="users table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Organization</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((row) => (
                      <TableRow
                        key={row.identifier}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {row.firstName} {row.lastName || ''}
                        </TableCell>
                        <TableCell>{row.rootOrgName || '-'}</TableCell>
                        <TableCell>{row?.profileDetails?.personalDetails?.primaryEmail || '-'}</TableCell>
                        <TableCell>{row?.profileDetails?.personalDetails?.mobile || '-'}</TableCell>
                        <TableCell>{row?.profileDetails?.profileStatus || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label="edit"
                            size="small"
                            onClick={() => handleEditUser(row)}
                          >
                            <PencilIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            aria-label="delete"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
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
            <Alert severity="info" sx={{ m: 2 }}>
              {searchQuery 
                ? "No users found matching your search criteria. Please try with different search parameters."
                : "No users available. Create one by clicking on add new user."}
            </Alert>
          )}
        </Paper>
        
        {/* Toast Notifications */}
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
      </Box>

      {/* Edit User Dialog */}
      <DynamicFormDialog
        open={open}
        onClose={() => setOpen(false)}
        fields={sampleFields}
        initialData={editUserData}
        onSubmit={handleSubmit}
      />
    </>
  );
};