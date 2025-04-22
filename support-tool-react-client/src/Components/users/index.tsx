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
  Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
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

const sampleFields: FieldDefinition[] = [
  {
    identifier: 'firstname',
    name: 'firstname',
    displayName: 'Name',
    fieldType: 'text',
    optional: false,
    selected: true,
    order: 1,
    fieldPath: 'profileDetails.personalDetails.firstname',
    validation: {
      minLength: 2,
      maxLength: 50,
      pattern: '^[A-Za-z\\s]+$',
      errorMessage: 'Please enter a valid name (letters only)'
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
      const requestPayload = {
        request: {
          fields: [],
          facets: FACETS_LIST,
          limit: pageSize, 
          query: query,
          filters: {
            status: 1,
            ...buildFilterPayload(filters)
          },
          offset: pageNumber * pageSize,
        }
      };
      
      const data = await usersService.getUsers(requestPayload);
      if (data.result) {
        setUsers(data.result.response.content || []);
        setUsersCount(data.result.response.count || 0);
        
        if (updateFacets) {
          setFacets(data.result.response.facets);
          initialLoadComplete.current = true;
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
  const buildFilterPayload = (filters: { [key: string]: string[] }) => {
    const payload: { [key: string]: string[] } = {};
    
    Object.entries(filters).forEach(([filterName, values]) => {
      if (values && values.length > 0) {
        payload[filterName] = values;
      }
    });
    
    return payload;
  };

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setPage(0);
      fetchUsers(0, rowsPerPage, searchQuery, selectedFilters, false);
    }
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
      fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, true);
    } catch (error) {
      console.error("Error in initial data fetch:", error);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render components
  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Header Section */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <div>
              <Typography variant="h4" component="h1" sx={{ margin: 0 }}>Users</Typography>
              <Typography variant="body2">User Data goes here.</Typography>                
            </div>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
            >
              Add new user
            </Button>
          </Box>

          {/* Search and Filter Section */}
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
                        onClick={handleClearSearch}
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
            
            {/* Active Filters Display */}
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

            {/* Filter Drawer */}
            <FilterDrawer
              open={isDrawerOpen}
              onClose={handleDrawerClose}
              facets={facets}
              filterConfig={filterConfig}
              onFilterChange={handleFilterChange}
              initialFilters={selectedFilters}
            />
          </div>
          
          {/* Users Table or Empty State */}
          {users && users.length > 0 ? (
            <>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="users table">
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
                    {users.map((row) => (
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
            <Alert severity="info">
              No users available. Create one by clicking on add new user.
            </Alert>
          )}
          
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
        </>
      )}

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