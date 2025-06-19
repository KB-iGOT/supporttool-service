import * as React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
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
  SelectChangeEvent,
  Autocomplete,
  CircularProgress,
  Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import { UserProfile } from "../../types/users";
import { FilterDrawer } from "./../common-components/filter-drawer";
import { usersService } from "../../services/users.service";
import { DynamicFormDialog } from "../common-components/dynamic-form-dialog/DynamicFormDialog";
import { FieldDefinition, FormData as CustomFormData } from "../../types/forms";
import { getNestedValue } from "../../utils/pathResolver";
import axios from "axios";
import { organisationService } from "../../services/organisations.service";
import { appContextType } from "../../types";
import { AppContext } from "../../Context/AppContext";

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

// Organization interface
interface Organization {
  identifier: string;
  orgName: string;
  isRootOrg: boolean | null;
}

const searchFields: Record<SearchFieldType, SearchFieldConfig> = {
  name: {
    type: 'name',
    label: 'Name',
    placeholder: 'Enter user name',
    path: 'query',
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
  
  // Organization states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [orgOffset, setOrgOffset] = useState(0);
  const [orgLoading, setOrgLoading] = useState(false);
  const [hasMoreOrgs, setHasMoreOrgs] = useState(true);
  const orgLimit = 10;

  // Add these state variables to track validation errors
  const [searchErrors, setSearchErrors] = useState<{
    email?: string;
    phone?: string;
  }>({});

  // Refs
  const initialLoadComplete = useRef(false);
  const orgListRef = useRef<HTMLUListElement>(null);
    // Get permissions from context
    const { checkPermissions } = React.useContext(AppContext) as appContextType;
    const permissions = checkPermissions();
  // Function to validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Function to validate phone number format
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  // Fetch organizations with pagination and search
  const fetchOrganizations = useCallback(async (offset = 0, query = "", reset = false) => {
    try {
      setOrgLoading(true);
      let request = {
        request: {
          filters: {},
          fields: ["identifier", "orgName"],
          sortBy: { createdDate: "Desc" },
          limit: orgLimit,
          offset: offset,
          query: query
        }
      }
      const response = await organisationService.fetchOrganisationsData(request)
        
      const responseData = response.result?.response || {};
      const newOrgs = responseData.content || [];
      
      // Update state
      if (reset) {
        setOrganizations(newOrgs);
      } else {
        setOrganizations(prev => [...prev, ...newOrgs]);
      }
      
      // Check if we have more items to load
      setHasMoreOrgs(newOrgs.length === orgLimit);
      setOrgOffset(offset + newOrgs.length);
      
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setToasts({
        message: "Failed to load organizations",
        open: true,
        severity: "error",
      });
    } finally {
      setOrgLoading(false);
    }
  }, []);

  // API and data fetching functions
  const fetchUsers = async (
    pageNumber = 0, 
    pageSize = 10, 
    query = "", 
    filters: { [key: string]: string[] } = {},
    updateFacets = true,
    selectedOrganization: Organization | null = null
  ) => {
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

  // Infinite scroll handler for organization dropdown
  const handleOrgScroll = useCallback(() => {
    if (orgListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = orgListRef.current;
      
      // When user has scrolled to the bottom
      if (scrollHeight - scrollTop <= clientHeight + 50 && !orgLoading && hasMoreOrgs) {
        fetchOrganizations(orgOffset, orgSearchQuery);
      }
    }
  }, [orgOffset, orgLoading, hasMoreOrgs, orgSearchQuery, fetchOrganizations]);

  // Event handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    
    // Clear errors when field is empty
    if (!value.trim()) {
      setSearchErrors({});
      return;
    }
    
    // Validate based on search type
    if (searchType === 'email' && value.trim()) {
      const isValid = validateEmail(value.trim());
      setSearchErrors(prev => ({
        ...prev,
        email: isValid ? undefined : 'Please enter a valid email address'
      }));
    } else if (searchType === 'phone' && value.trim()) {
      const isValid = validatePhone(value.trim());
      setSearchErrors(prev => ({
        ...prev, 
        phone: isValid ? undefined : 'Please enter a valid phone number (10-15 digits, may include + prefix)'
      }));
    } else {
      // Clear errors for other search types or empty fields
      setSearchErrors({});
    }
  };

  const handleOrgSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOrgSearchQuery(value);
    
    // Reset organization list and fetch with new search query
    setOrgOffset(0);
    setHasMoreOrgs(true);
    fetchOrganizations(0, value, true);
  };
  
  const handleSearchTypeChange = (event: SelectChangeEvent) => {
    const newSearchType = event.target.value as SearchFieldType;
    setSearchType(newSearchType);
    // Clear search query when changing search type
    setSearchQuery("");
    // Clear selected org if moving away from name search
    if (newSearchType !== 'name') {
      setSelectedOrg(null);
    }
    // Clear validation errors
    setSearchErrors({});
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleOrgSelect = (_event: React.SyntheticEvent, value: Organization | null) => {
    setSelectedOrg(value);
  };

  const handleSearchFieldBlur = () => {
    if (!searchQuery.trim()) return;
    
    if (searchType === 'email') {
      const isValid = validateEmail(searchQuery.trim());
      if (!isValid) {
        setSearchErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
        setToasts({
          message: "Please enter a valid email address",
          open: true,
          severity: "warning",
        });
      }
    } else if (searchType === 'phone') {
      const isValid = validatePhone(searchQuery.trim());
      if (!isValid) {
        setSearchErrors(prev => ({
          ...prev,
          phone: 'Please enter a valid phone number (10-15 digits, may include + prefix)'
        }));
        setToasts({
          message: "Please enter a valid phone number (10-15 digits, may include + prefix)",
          open: true,
          severity: "warning",
        });
      }
    }
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
    setSearchErrors({});
    setPage(0);
    fetchUsers(0, rowsPerPage, "", selectedFilters, false);
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

  // Add this new function to handle form reset and data refresh
  const resetFormAndFetchUsers = () => {
    // Clear form data
    setEditUserData({});
    setModifiedFields({});
    
    // Clear any search errors if they exist
    setSearchErrors({});
    
    // Fetch users again with current filters and search parameters
    fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg);
  };

  // Effects
  useEffect(() => {
    try {
      // Initial load - just get users without search query
      // fetchUsers(page, rowsPerPage, "", {}, true);
      
      // Initial load of organizations
      fetchOrganizations(0, "", true);
    } catch (error) {
      console.error("Error in initial data fetch:", error);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Add scroll event listener to organization list
  useEffect(() => {
    const listElement = orgListRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleOrgScroll);
      return () => {
        listElement.removeEventListener('scroll', handleOrgScroll);
      };
    }
  }, [handleOrgScroll]);

  // Add these new handler functions to your Users component
  const handleOrgFieldBlur = () => {
    // Check if organization is required (when searchType is 'name') and is not selected
    if (searchType === 'name' && !selectedOrg && searchQuery.trim() !== '') {
      setToasts({
        message: "Organization is required when searching by name",
        open: true,
        severity: "warning",
      });
    }
  };

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
          
          <Grid container spacing={2} alignItems="flex-start">
            {/* Search Type Dropdown */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth sx={{ mt: 0 }}>
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
            
            {/* Organization Selector - required when search type is 'name' */}
            {searchType === 'name' && (
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  id="organization-select"
                  options={organizations}
                  getOptionLabel={(option) => option.orgName}
                  value={selectedOrg}
                  onChange={handleOrgSelect}
                  onBlur={handleOrgFieldBlur}
                  sx={{ mt: 0 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Organization"
                      placeholder="Select an organization"
                      onChange={handleOrgSearchChange}
                      required={true}
                      error={searchType === 'name' && !selectedOrg && searchQuery.trim() !== ''}
                      helperText={searchType === 'name' && !selectedOrg && searchQuery.trim() !== '' ? 'Organization is required when searching by name' : ' '}
                      FormHelperTextProps={{ sx: { mt: 0, minHeight: '1.25em' } }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <BusinessIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {orgLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.identifier}>{option.orgName}</li>
                  )}
                  ListboxProps={{
                    ref: orgListRef,
                    style: { maxHeight: 200, overflow: 'auto' }
                  }}
                  filterOptions={(x) => x}
                  loading={orgLoading}
                  loadingText="Loading organizations..."
                  noOptionsText="No organizations found"
                  fullWidth
                />
              </Grid>
            )}
            
            {/* Search Text Field - highlight required status and validation errors */}
            <Grid item xs={12} sm={searchType === 'name' ? 3 : 7}>
              <TextField
                fullWidth
                label={searchFields[searchType].label}
                placeholder={searchFields[searchType].placeholder}
                variant="outlined"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                onBlur={handleSearchFieldBlur}
                required={true}
                error={!searchQuery.trim() || 
                  (searchType === 'email' && Boolean(searchErrors.email)) || 
                  (searchType === 'phone' && Boolean(searchErrors.phone))
                }
                helperText={
                  !searchQuery.trim() ? `${searchFields[searchType].label} is required` : 
                  (searchType === 'email' && searchErrors.email) ? searchErrors.email : 
                  (searchType === 'phone' && searchErrors.phone) ? searchErrors.phone : ' '
                }
                FormHelperTextProps={{ sx: { mt: 0, minHeight: '1.25em' } }}
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
            
            {/* Search Button - aligned with the input fields */}
            <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                disabled={
                  !searchQuery.trim() || 
                  (searchType === 'name' && !selectedOrg) ||
                  (searchType === 'email' && !!searchErrors.email) ||
                  (searchType === 'phone' && !!searchErrors.phone)
                }
                sx={{ height: '56px', mt: 0 }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
          
          {/* Active Search Display - adjusted margin to account for consistent spacing */}
          {(searchQuery || selectedOrg) && (
            <Box mt={3}>
              <Alert severity="info">
                {searchQuery && (
                  <>Searching for {searchType}: <strong>{searchQuery}</strong></>
                )}
                {selectedOrg && (
                  <>{searchQuery ? ' in ' : 'Searching in '} organization: <Chip 
                    label={selectedOrg.orgName} 
                    variant="outlined" 
                    size="small" 
                    icon={<BusinessIcon />}
                  /></>
                )}
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
                          {permissions.canWrite && (
                            <IconButton
                              aria-label="edit"
                              size="small"
                              onClick={() => handleEditUser(row)}
                              disabled={!permissions.canWrite}
                            >
                              <PencilIcon fontSize="small" />
                            </IconButton>
                          )}
                          {permissions.canDelete && (
                            <IconButton
                              aria-label="delete"
                              size="small"
                              onClick={() => handleDeleteUser(row)}
                              disabled={!permissions.canDelete}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
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
              {searchQuery || selectedOrg
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