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
import { SearchPanel, SearchFieldType, searchFields, UserStatusType } from "./SearchPanel"; // Import UserStatusType
import { UsersTable } from "./UsersTable";
import { Organization } from "./types";
import { HelpDialog } from "./HelpDialog"; // Import the new HelpDialog component
import { CreateUserDialog } from "./CreateUserDialog"; // Import the CreateUserDialog component
import { useActionInterceptor } from "../../../hooks/useActionInterceptor";
import { useLocation } from "react-router-dom";


// Configuration constants
const FACETS_LIST = ["rootChannel"];
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
    optional: true,
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
  },
  {
    identifier: 'externalSystemId',
    name: 'externalSystemId',
    displayName: 'External System ID',
    fieldType: 'text',
    optional: true,
    description: "This is the user's unique ID from an external system like eHRMS.",
    selected: true,
    order: 4,
    placeholder: 'Enter External System ID',
    fieldPath: 'profileDetails.additionalProperties.externalSystemId',
    validation: {
      minLength: 1,
      maxLength: 50,
      errorMessage: 'Please enter a valid External System ID'
    }
  },
  {
    identifier: 'externalSystem',
    name: 'externalSystem',
    displayName: 'External System',
    description: "If the External System name is not present, check with the user and add or update it with 'eHRMS ID'.",
    fieldType: 'text',
    optional: true,
    selected: true,
    order: 5,
    placeholder: 'Enter External System Name',
    fieldPath: 'profileDetails.additionalProperties.externalSystem',
    validation: {
      minLength: 2,
      maxLength: 50,
      errorMessage: 'Please enter a valid External System Name'
    }
  },
];

// Remove the channel field from createUserFields as we'll use a custom component for it
const createUserFields: FieldDefinition[] = [
  {
    identifier: 'firstName',
    name: 'firstName',
    displayName: 'Full Name',
    fieldType: 'text',
    optional: false,
    selected: true,
    order: 1,
    placeholder: 'Enter full name',
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: '^[A-Za-z\\s.]+$',
      errorMessage: 'Please enter a valid name (letters, spaces, and periods only)'
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
    validation: {
      minLength: 10,
      maxLength: 15,
      pattern: '^\\+?[0-9]{10,15}$',
      errorMessage: 'Please enter a valid phone number (10-15 digits, may include + prefix)'
    }
  },
  {
    identifier: 'roles',
    name: 'roles',
    displayName: 'Roles',
    fieldType: 'select',
    optional: false,
    selected: true,
    order: 5,
    defaultValue: ['PUBLIC'],
    placeholder: 'Select user roles',
    options: [
      { label: 'Public', value: 'PUBLIC' },
    ],
    validation: {
      errorMessage: 'Please select at least one role'
    }
  }
];

export const UsersList = () => {
  // State declarations
    const location = useLocation();
    const moduleState = location.state;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [facets, setFacets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchFieldType>('email');
  const [open, setOpen] = useState(false);
  const [modifiedFields, setModifiedFields] = useState<Record<string, any>>({});
  const [originalUserData, setoriginalUserData] = useState<Record<string, any>>({});
  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });
  
  // Organization state
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Add new state for help dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Add new state for create user dialog
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [creatingUser, setCreatingUser] = useState(false);

  // Add new state for user status
  const [userStatus, setUserStatus] = useState<UserStatusType>('all');

  // Refs
  const initialLoadComplete = useRef(false);

  // Get permissions from context
  const { checkPermissions } = React.useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

  const [ userEditData,setUserEditData ] = useState<Record<string, any>>({});
  
  // Create a ref to hold the latest form data
  const latestFormDataRef = useRef<CustomFormData>({});
  const latestCreateDataRef = useRef<any>({});

  const handleEditAction = (data: CustomFormData) => {
    // Update both state and ref
    setUserEditData(data);
    latestFormDataRef.current = data;
    
    // Call handleEditSubmit which will use the latest data from the ref
    handleEditSubmit();
  }

  const handleCreateAction = (data: any) => {
    // Update the ref with create data
    latestCreateDataRef.current = data;
    
    // Call handleCreateSubmit which will use the latest data from the ref
    handleCreateSubmit();
  }

  // Modify your useActionInterceptor to use the ref instead
  const { handleAction: handleEditSubmit } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => handleSubmit(interceptPayload, latestFormDataRef.current),
    getPayload: () => ({})
  });

  // Add useActionInterceptor for create user
  const { handleAction: handleCreateSubmit } = useActionInterceptor({
    actionType: 'Post',
    onComplete: (interceptPayload) => handleCreateUser(interceptPayload, latestCreateDataRef.current),
    getPayload: () => ({})
  });

  // API and data fetching functions
  const fetchUsers = async (
    pageNumber = 0, 
    pageSize = 10, 
    query = "", 
    filters: { [key: string]: string[] } = {},
    updateFacets = true,
    selectedOrganization: Organization | null = null,
    status: UserStatusType = 'active' 
  ) => {
    setLoading(true);
    let freeTextQuery : string = '';
    console.log(permissions,'permissionspermissionspermissions')
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
            rootOrgName: [selectedOrganization.channel]
          };
      }
      
      // Determine status value for API
      let statusValue;
      if (status === 'active') {
        statusValue = 1;
      } else if (status === 'inactive') {
        statusValue = 0;
      }
      // If status is 'all', don't include status in filters
      
      const requestPayload = {
        request: {
          fields: [],
          facets: FACETS_LIST,
          limit: pageSize,
          filters: {
            ...(status !== 'all' ? { status: statusValue } : {}), // Only include status if not 'all'
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

  const handleUserStatusChange = (newStatus: UserStatusType) => {
    setUserStatus(newStatus);
  };

  const handleSearch = () => {
    // Validate required fields based on search type
    if (searchType === 'name' || searchType === 'roles') {
      if (!selectedOrg) {
        setToasts({
          message: `Please select an organization when searching by ${searchType}`,
          open: true,
          severity: "warning",
        });
        return;
      }
      if (!searchQuery.trim()) {
        setToasts({
          message: `Please ${searchType === 'roles' ? 'select a role' : 'enter a name'} to search`,
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
    fetchUsers(0, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg, userStatus);
  };

  const handleFilterChange = (filters: { [key: string]: string[] }) => {
    setSelectedFilters(filters);
    setPage(0);
    fetchUsers(0, rowsPerPage, searchQuery, filters, false, selectedOrg, userStatus);
  };

  const handleToastClose = () => {
    setToasts({ message: "", open: false, severity: undefined });
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg, userStatus);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchUsers(0, newRowsPerPage, searchQuery, selectedFilters, false, selectedOrg, userStatus);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedOrg(null);
    setUserStatus('all');
    setPage(0);
    setUsers([]);
  };

  const handleEditUser = (user: Record<string, any>) => {
    setoriginalUserData(user);
    setOpen(true);
  };

  const handleDeleteUser = (user: Record<string, any>) => {
    console.log("Delete user functionality to be implemented for user:", user);
  };

  // Submit handler for user updates
  const handleSubmit = async (interceptPayload: CustomFormData, formData: Record<string, any>) => {
    try {
      setLoading(true);
      
      // Use formData instead of userEditData
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
          userId: originalUserData.identifier,
          profileDetails: JSON.parse(JSON.stringify(originalUserData.profileDetails || {}))
        }
      };
      
      // Loop through all fields defined in sampleFields
      sampleFields.forEach(field => {
        // Extract value from form data
        let newValue;
        if (formData instanceof Map) {
          // If data is a Map (FormData)
          newValue = formData.get(field.identifier);
        } else if (typeof formData === 'object' && formData !== null) {
          // If formData is a regular object
          newValue = field.fieldPath ? 
            getNestedValue(formData, field.fieldPath) : 
            formData[field.identifier];
        }
        
        // Get original value from user data
        const originalValue = field.fieldPath ? 
          getNestedValue(originalUserData, field.fieldPath) : 
          originalUserData[field.identifier];

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
            if (field.identifier === 'email' && newValue) {
              // Email needs to be in both root level and in personalDetails
              updatePayload.request.email = newValue;
              
              // Ensure personalDetails exists
              if (!updatePayload.request.profileDetails.personalDetails) {
                updatePayload.request.profileDetails.personalDetails = {};
              }
              // Set email in personalDetails
              updatePayload.request.profileDetails.personalDetails.primaryEmail = newValue;
            } else if (field.identifier === 'phone' && newValue) {
              // Email needs to be in both root level and in personalDetails
              updatePayload.request.phone = newValue;
              
              // Ensure personalDetails exists
              if (!updatePayload.request.profileDetails.personalDetails) {
                updatePayload.request.profileDetails.personalDetails = {};
              }
              // Set email in personalDetails
              updatePayload.request.profileDetails.personalDetails.mobile = newValue;
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
      // updatePayload = {email: '',}
      let request  = {
        payload: updatePayload,
        changedFields,
        userId: formData.identifier,
        jiraLink: interceptPayload.jiraLink,
        module: moduleState?.name || 'users',
      }
      // Send the update request
      const response : any = await usersService.updateUser(request);
      
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
    setoriginalUserData({});
    setModifiedFields({});
    
    // Fetch users again with current filters and search parameters
    fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg, userStatus);
  };

  // Add a function to force refresh user data after role updates
  const forceRefreshUsers = useCallback(() => {
 
    // Fetch users with current search parameters immediately
    fetchUsers(page, rowsPerPage, searchQuery, selectedFilters, false, selectedOrg, userStatus);
  }, [page, rowsPerPage, searchQuery, selectedFilters, selectedOrg, userStatus]);

  // Add function to handle help dialog
  const handleHelpOpen = () => {
    setHelpDialogOpen(true);
  };
  
  const handleHelpClose = () => {
    setHelpDialogOpen(false);
  };

  // Modify the handleCreateUser function to call all three APIs in sequence

  const handleCreateUser = async (interceptPayload: CustomFormData, data: any) => {
    try {
      setCreatingUser(true);
      
      // Step 1: Create the user with audit logging support
      const createUserPayload = {
        payload: {
          request: {
            email: data.email,
            firstName: data.firstName,
            lastName: "",
            password: "Password@123", // Default password, should be changed by user later
            channel: data.channel
          }
        },
        changedFields: {
          'New User': {
            original: '',
            new: `${data.firstName} (${data.email})`
          }
        },
        userId: data.email, // Use email as identifier for audit
        jiraLink: interceptPayload.jiraLink, // Use jiraLink from interceptor
        module: moduleState?.name || 'users',
      };
      
      
      const createResponse = await usersService.createUser(createUserPayload);
      
      if (!createResponse || createResponse.responseCode !== "OK") {
        throw new Error(createResponse?.responseMessage || "Failed to create user");
      }
      
      // Extract the userId from the response
      const userId = createResponse.result.userId;
      if (!userId) {
        throw new Error("User ID not found in response");
      }
      
      // Step 2: Assign roles to the user
      const roleAssignPayload = {
        request: {
          userId: userId,
          organisationId: data.orgId || createResponse.result.rootOrgId,
          roles: data.roles || ['PUBLIC']
        }
      };
      
      
      const roleResponse = await usersService.assignUserRoles(
        userId, 
        roleAssignPayload.request.organisationId, 
        roleAssignPayload.request.roles
      );
      
      if (!roleResponse || roleResponse.responseCode !== "OK") {
        console.warn("Role assignment failed, continuing with profile update");
      }
      
      // Step 3: Update profile with additional details
      const profileUpdatePayload = {
        request: {
          userId: userId,
          phone: data.phone,
          maskedPhone: data.phone,
          firstName: data.firstName,
          lastName: "",
          profileDetails: {
            profileStatus: "VERIFIED",
            personalDetails: {
              firstname: data.firstName,
              primaryEmail: data.email,
              mobile: data.phone,
              phoneVerified: true
            },
            mandatoryFieldsExists: true
          }
        }
      };
      
      
      const updateResponse = await usersService.updateUserV1(userId, profileUpdatePayload);
      
      if (!updateResponse || updateResponse.responseCode !== "OK") {
        console.warn("Profile update failed, but user was created");
      }
      
      setToasts({
        message: "User created successfully",
        open: true,
        severity: "success",
      });
      
      // Close the dialog and refresh users
      setCreateUserDialogOpen(false);
      
      // Reset page to 0 and fetch users again
      setPage(0);
      fetchUsers(0, rowsPerPage, "", selectedFilters, true, null, userStatus);
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      let message = error?.response?.data?.error?.params?.errmsg || error.message || "An error occurred while creating user";
      setToasts({
        message: message,
        open: true,
        severity: "error",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Render components
  return (
    <>
      {loading && <LinearProgress />}
      
      <Box sx={{ position: 'relative' }}>
        {/* Header Section - Updated with Help and Create User buttons */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <div>
            <Typography variant="h4" component="h1" sx={{ margin: 0 }}>User Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Search for users by name, email, or phone number
            </Typography>                
          </div>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateUserDialogOpen(true)}
              sx={{ mr: 2 }}
            >
              Create User
            </Button>
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
        </Box>

        {/* Search Panel Component */}
        <SearchPanel
          searchQuery={searchQuery}
          searchType={searchType}
          selectedOrg={selectedOrg}
          userStatus={userStatus}
          onSearch={handleSearch}
          onSearchQueryChange={handleSearchQueryChange}
          onSearchTypeChange={handleSearchTypeChange}
          onUserStatusChange={handleUserStatusChange}
          onClearSearch={handleClearSearch}
          onOrgSelect={handleOrgSelect}
        />
            
        {/* Active Filters Display */}
        {/* {(Object.keys(selectedFilters).length > 0 || userStatus !== 'all') && (
          <Box mt={2} p={2} mb={3} bgcolor="white" borderRadius={1} boxShadow={1}>
            <Typography variant="subtitle2" gutterBottom>Active Filters:</Typography>
            {userStatus !== 'all' && (
              <Box mb={1}>
                <strong>Status:</strong> {userStatus === 'active' ? 'Active Users' : 'Inactive Users'}
              </Box>
            )}
            {Object.entries(selectedFilters).map(([category, values]) => (
              values && values.length > 0 ? (
                <Box key={category} mb={1}>
                  <strong>{category}:</strong> {values.join(", ")}
                </Box>
              ) : null
            ))}
          </Box>
        )} */}

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
          searchType={searchType}
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
        initialData={originalUserData}
        onSubmit={handleEditAction}
        onBackDropClose={true}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        onSubmit={handleCreateAction}
        processing={creatingUser}
      />
    </>
  );
};