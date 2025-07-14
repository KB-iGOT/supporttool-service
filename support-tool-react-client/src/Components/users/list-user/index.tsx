import * as React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box, 
  LinearProgress,
  Typography,
  Button,
  Alert,
  AlertColor,
  Snackbar,
  Paper,
  Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HelpIcon from "@mui/icons-material/Help"; // Import the help icon
import { UserProfile } from "../../../types/users";
import { FilterDrawer } from "../../common-components/filter-drawer";
import { usersService } from "../../../services/users.service";
import { DynamicFormDialog } from "../../common-components/dynamic-form-dialog/DynamicFormDialog";
import { FieldDefinition, FormData as CustomFormData } from "../../../types/forms";
import { getNestedValue } from "../../../utils/pathResolver";
import { AppContext } from "../../../Context/AppContext";
import { appContextType } from "../../../types";
import { SearchPanel, SearchFieldType, searchFields } from "./SearchPanel";
import { UsersTable } from "./UsersTable";
import { Organization } from "./types";
import { HelpDialog } from "./HelpDialog"; // Import the new HelpDialog component

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
    placeholder: 'Enter first name',
    fieldPath: 'profileDetails.personalDetails.firstname',
    validation: {
      minLength: 2,
      maxLength: 50,
      pattern: '^.*$',
      errorMessage: 'Please enter a valid name'
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

export const UsersList = () => {
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
  
  // Organization state
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Add new state for help dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Refs
  const initialLoadComplete = useRef(false);

  // Get permissions from context
  const { checkPermissions } = React.useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

  // API and data fetching functions
  const fetchUsers = async (
    pageNumber = 0, 
    pageSize = 10, 
    query = "", 
    filters: { [key: string]: string[] } = {},
    updateFacets = true,
    selectedOrganization: Organization | null = null
  ) => {
    debugger
    setLoading(true);
    let freeTextQuery : string = '';
    try {
      // Build the filter object based on search type and query
      let searchFilters = { ...filters };
      
      // Only add search filter if there's a query
      if (query.trim()) {
        const searchPath = searchFields[searchType].path;
        if(searchPath !== 'query') {
          // If the search path is not 'query', we need to ensure it matches the expected structure
          searchFilters = {
            ...searchFilters,
            [searchPath]: [query.trim()]  // Wrap in array to match expected type
          };
        } else {
          freeTextQuery = query.trim();
        }
      }
      
      // Add organization filter if selected
      if (selectedOrganization) {
        searchFilters = {
          ...searchFilters,
          rootOrgName: [selectedOrganization.orgName]
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
        query: freeTextQuery
      };
      
      const data = await usersService.getUsers(requestPayload);
      if (data.result) {
        // Important: Clear the state first to ensure React detects changes
        setUsers([]);
        
          setUsers(data.result.response.content || []);
          setUsersCount(data.result.response.count || 0);
          
          if (updateFacets) {
            setFacets(data.result.response.facets || []);
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

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  // Event handlers
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
  };
  
  const handleSearchTypeChange = (newType: SearchFieldType) => {
    setSearchType(newType);
    // Clear search query when changing search type
    setSearchQuery("");
    // Clear selected org if moving away from name search
    if (newType !== 'name') {
      setSelectedOrg(null);
    }
  };

  const handleOrgSelect = (org: Organization | null) => {
    setSelectedOrg(org);
  };

  const handleSearch = () => {
    // Validate required fields based on search type
    if (searchType === 'name') {
      if (!selectedOrg) {
        setToasts({
          message: "Please select an organization when searching by name",
          open: true,
          severity: "warning",
        });
        return;
      }
      if (!searchQuery.trim()) {
        setToasts({
          message: "Please enter a name to search",
          open: true,
          severity: "warning",
        });
        return;
      }
    } else if (searchType === 'email') {
      if (!searchQuery.trim()) {
        setToasts({
          message: "Please enter an email to search",
          open: true,
          severity: "warning",
        });
        return;
      }
      if (!validateEmail(searchQuery.trim())) {
        setToasts({
          message: "Please enter a valid email address",
          open: true,
          severity: "warning",
        });
        return;
      }
    } else if (searchType === 'phone') {
      if (!searchQuery.trim()) {
        setToasts({
          message: "Please enter a phone number to search",
          open: true,
          severity: "warning",
        });
        return;
      }
      if (!validatePhone(searchQuery.trim())) {
        setToasts({
          message: "Please enter a valid phone number (10-15 digits, may include + prefix)",
          open: true,
          severity: "warning",
        });
        return;
      }
    }

    // Proceed with search
    setPage(0);
    fetchUsers(0, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg);
  };

  const handleFilterChange = (filters: { [key: string]: string[] }) => {
    setSelectedFilters(filters);
    setPage(0);
    fetchUsers(0, rowsPerPage, searchQuery, filters, false, selectedOrg);
  };

  const handleToastClose = () => {
    setToasts({ message: "", open: false, severity: undefined });
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchUsers(0, newRowsPerPage, searchQuery, selectedFilters, false, selectedOrg);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedOrg(null);
    setPage(0);
    // fetchUsers(0, rowsPerPage, "", selectedFilters, false);
    setUsers([]);
  };

  const handleEditUser = (user: Record<string, any>) => {
    setEditUserData(user);
    setOpen(true);
  };

  const handleDeleteUser = (user: Record<string, any>) => {
    console.log("Delete user functionality to be implemented for user:", user);
  };

  // Submit handler for user updates
  const handleSubmit = async (data: CustomFormData) => {
    try {
      setLoading(true);
      
      // Track field changes for display purposes
      const changedFields: Record<string, any> = {};
      
      // Create a deep copy of the original user data as our base
      const updatePayload: {
        request: {
          userId: any;
          profileDetails: any;
          [key: string]: any; // Allow additional properties like email
        }
      } = {
        request: {
          userId: editUserData.identifier,
          profileDetails: JSON.parse(JSON.stringify(editUserData.profileDetails || {}))
        }
      };
      
      // Loop through all fields defined in sampleFields
      sampleFields.forEach(field => {
        // Extract value from form data
        let newValue;
        if (data instanceof Map) {
          // If data is a Map (FormData)
          newValue = data.get(field.identifier);
        } else if (typeof data === 'object' && data !== null) {
          // If data is a regular object
          newValue = field.fieldPath ? 
            getNestedValue(data, field.fieldPath) : 
            data[field.identifier];
        }
        
        // Get original value from user data
        const originalValue = field.fieldPath ? 
          getNestedValue(editUserData, field.fieldPath) : 
          editUserData[field.identifier];

        // Only process changed fields
        if (String(newValue) !== String(originalValue) && newValue !== undefined) {
          // For display
          changedFields[field.displayName] = {
            original: originalValue ?? '',
            new: newValue ?? ''
          };
          
          // For API update - set directly in the appropriate path
          if (field.fieldPath) {
            const pathParts = field.fieldPath.split('.');
            
            // Special handling for email field which needs to be at the top level and in personalDetails
            if (field.identifier === 'email') {
              // Email needs to be in both root level and in personalDetails
              updatePayload.request.email = newValue;
              
              // Ensure personalDetails exists
              if (!updatePayload.request.profileDetails.personalDetails) {
                updatePayload.request.profileDetails.personalDetails = {};
              }
              // Set email in personalDetails
              updatePayload.request.profileDetails.personalDetails.primaryEmail = newValue;
            } else {
              // For other fields, navigate the path and set the value
              let current = updatePayload.request;
              
              for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!current[part]) {
                  current[part] = {};
                }
                current = current[part];
              }
              
              current[pathParts[pathParts.length - 1]] = newValue;
            }
          } else {
            // Direct properties (not nested)
            updatePayload.request[field.identifier] = newValue;
          }
        }
      });

      console.log('Modified fields:', changedFields);
      console.log('Update payload:', updatePayload);
      
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
      // Send the update request
      const response : any = await usersService.updateUser(editUserData.identifier, updatePayload);
      
      if (response && response.responseCode === "OK") {
        setToasts({ 
          message: "User updated successfully",
          open: true,
          severity: "success",
        });
        
        // Close the form dialog
        setOpen(false);
        
        // Reset form and refresh data
        resetFormAndFetchUsers();
      } else {
        throw new Error(response?.responseMessage || "Failed to update user");
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      let message = error?.response?.data?.error?.params?.errmsg || error.message || "An error occurred while updating user";
      setToasts({
        message: message,
        open: true,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle form reset and data refresh
  const resetFormAndFetchUsers = () => {
    // Clear form data
    setEditUserData({});
    setModifiedFields({});
    
    // Fetch users again with current filters and search parameters
    fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg);
  };

  // Add a function to force refresh user data after role updates
  const forceRefreshUsers = useCallback(() => {
    console.log("Forcing user data refresh after role update");
    setUsers([]); // Clear current users to trigger re-fetch
    setTimeout(() => {
      fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg);
    },1000);
  }, [page, rowsPerPage, searchQuery, selectedFilters, selectedOrg]);

  // Add function to handle help dialog
  const handleHelpOpen = () => {
    setHelpDialogOpen(true);
  };
  
  const handleHelpClose = () => {
    setHelpDialogOpen(false);
  };

  // Render components
  return (
    <>
      {loading && <LinearProgress />}
      
      <Box sx={{ position: 'relative' }}>
        {/* Header Section - Updated with Help button */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <div>
            <Typography variant="h4" component="h1" sx={{ margin: 0 }}>User Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Search for users by name, email, or phone number
            </Typography>                
          </div>
          <Tooltip title="View available actions">
            <Button
              variant="outlined"
              startIcon={<HelpIcon />}
              onClick={handleHelpOpen}
              sx={{ ml: 2 }}
            >
              Help
            </Button>
          </Tooltip>
        </Box>

        {/* Search Panel Component */}
        <SearchPanel
          searchQuery={searchQuery}
          searchType={searchType}
          selectedOrg={selectedOrg}
          onSearch={handleSearch}
          onSearchQueryChange={handleSearchQueryChange}
          onSearchTypeChange={handleSearchTypeChange}
          onClearSearch={handleClearSearch}
          onOrgSelect={handleOrgSelect}
        />
            
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
        
        {/* Users Table Component */}
        <UsersTable
          users={users}
          usersCount={usersCount}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          permissions={permissions}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onUserUpdated={forceRefreshUsers} // Use the new function here
        />
        
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
        
        {/* Help Dialog */}
        <HelpDialog 
          open={helpDialogOpen} 
          onClose={handleHelpClose} 
        />

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