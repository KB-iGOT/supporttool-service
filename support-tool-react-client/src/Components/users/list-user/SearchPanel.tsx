import * as React from "react";
import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  InputAdornment,
  SelectChangeEvent,
  Alert,
  Chip,
  Divider,
  Stack,
  SvgIconProps
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import BusinessIcon from "@mui/icons-material/Business";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { Organization } from "./types";
import { OrganizationSelector } from "./OrganizationSelector";

// Type definitions
export type SearchFieldType = 'name' | 'email' | 'phone' | 'userId' | 'roles';
export type UserStatusType = 'active' | 'inactive' | 'all';
interface SearchFieldConfig {
  type: SearchFieldType;
  label: string;
  placeholder: string;
  path: string;
  icon: React.ReactElement<SvgIconProps>;
}

export const searchFields: Record<SearchFieldType, SearchFieldConfig> = {
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
  },
  userId: {
    type: 'userId',
    label: 'User ID',
    placeholder: 'Enter UUID',
    path: 'identifier',
    icon: <FingerprintIcon />
  },
  roles: {
    type: 'roles',
    label: 'Roles',
    placeholder: 'Select role',
    path: 'organisations.roles',
    icon: <PersonIcon />
  }
};

// Validation patterns
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[0-9]{10,15}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Status configurations for consistent display
const STATUS_CONFIG = {
  active: {
    icon: <CheckCircleOutlineIcon color="success" />,
    label: 'Active Users',
    color: 'success' as const
  },
  inactive: {
    icon: <BlockIcon color="error" />,
    label: 'Inactive Users',
    color: 'error' as const
  },
  all: {
    icon: <FilterAltIcon />,
    label: 'All Users',
    color: 'default' as const
  }
};

interface SearchPanelProps {
  searchQuery: string;
  searchType: SearchFieldType;
  selectedOrg: Organization | null;
  userStatus: UserStatusType;
  onSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onSearchTypeChange: (type: SearchFieldType) => void;
  onUserStatusChange: (status: UserStatusType) => void;
  onClearSearch: () => void;
  onOrgSelect: (org: Organization | null) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  searchQuery,
  searchType,
  selectedOrg,
  userStatus,
  onSearch,
  onSearchQueryChange,
  onSearchTypeChange,
  onUserStatusChange,
  onClearSearch,
  onOrgSelect
}) => {
  // State for validation
  const [searchErrors, setSearchErrors] = useState<Record<string, string | undefined>>({});
  
  // Available roles options
  const rolesOptions = [
    "PUBLIC",
    "CONTENT_CREATOR", 
    "CONTENT_REVIEWER",
    "ORG_ADMIN",
    "MDO_ADMIN",
    "MDO_LEADER",
  ];

  // Validation functions
  const validateInput = (value: string, type: SearchFieldType): boolean => {
    if (!value.trim()) return true;
    
    switch (type) {
      case 'email':
        return VALIDATION_PATTERNS.email.test(value);
      case 'phone':
        return VALIDATION_PATTERNS.phone.test(value);
      case 'userId':
        return VALIDATION_PATTERNS.uuid.test(value);
      default:
        return true;
    }
  };

  // Error message lookup
  const getErrorMessage = (type: SearchFieldType): string => {
    switch (type) {
      case 'email':
        return 'Please enter a valid email address';
      case 'phone':
        return 'Please enter a valid phone number (10-15 digits)';
      case 'userId':
        return 'Please enter a valid UUID format';
      default:
        return '';
    }
  };

  // Handler functions
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onSearchQueryChange(value);
    
    if (!value.trim()) {
      setSearchErrors({});
      return;
    }
    
    // Only validate specific search types
    if (['email', 'phone', 'userId'].includes(searchType)) {
      const isValid = validateInput(value.trim(), searchType);
      if (!isValid) {
        setSearchErrors({ [searchType]: getErrorMessage(searchType) });
      } else {
        setSearchErrors({});
      }
    }
  };

  const handleSearchTypeChange = (event: SelectChangeEvent) => {
    const newSearchType = event.target.value as SearchFieldType;
    onSearchTypeChange(newSearchType);
    setSearchErrors({});
  };

  const handleUserStatusChange = (event: SelectChangeEvent) => {
    onUserStatusChange(event.target.value as UserStatusType);
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && isSearchEnabled()) {
      onSearch();
    }
  };

  const handleSearchFieldBlur = () => {
    if (!searchQuery.trim()) return;
    
    if (['email', 'phone', 'userId'].includes(searchType)) {
      const isValid = validateInput(searchQuery.trim(), searchType);
      if (!isValid) {
        setSearchErrors({ [searchType]: getErrorMessage(searchType) });
      }
    }
  };

  // Helper function to check if search button should be enabled
  const isSearchEnabled = (): boolean => {
    if (searchType === 'roles') {
      return !!selectedOrg && !!searchQuery.trim();
    }
    if (!searchQuery.trim()) return false;
    if (searchType === 'name' && !selectedOrg) return false;
    if (searchErrors[searchType]) return false;
    return true;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Search Users</Typography>

      <Grid container spacing={2}>
        {/* Search criteria row */}
        <Grid item xs={12}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              {/* Search Type Selector */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="search-type-label">Search By</InputLabel>
                  <Select
                    labelId="search-type-label"
                    id="search-type-select"
                    value={searchType}
                    label="Search By"
                    onChange={handleSearchTypeChange}
                  >
                    {Object.entries(searchFields).map(([key, field]) => (
                      <MenuItem key={key} value={key}>
                        <Box display="flex" alignItems="center">
                          {React.cloneElement(field.icon as React.ReactElement)}
                          <Box ml={1}>{field.label}</Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* User Status Selector */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="user-status-label">User Status</InputLabel>
                  <Select
                    labelId="user-status-label"
                    id="user-status-select"
                    value={userStatus}
                    label="User Status"
                    onChange={handleUserStatusChange}
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        <Box display="flex" alignItems="center">
                          {React.cloneElement(config.icon, { sx: { mr: 1 } })}
                          {config.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Organization Selector - shown for name searches and role searches */}
              {(searchType === 'name' || searchType === 'roles') && (
                <Grid item xs={12} sm={6}>
                  <OrganizationSelector 
                    selectedOrg={selectedOrg}
                    onOrgSelect={onOrgSelect}
                    onBlur={() => {}}
                    error={(searchType === 'name' || searchType === 'roles') && !selectedOrg && searchQuery.trim() !== ''}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>

        {/* Divider */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* Search field and button */}
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} sm={9}>
              {searchType === 'roles' ? (
                <FormControl fullWidth error={!searchQuery.trim()}>
                  <InputLabel id="roles-search-label">Select Role</InputLabel>
                  <Select
                    labelId="roles-search-label"
                    id="roles-search-select"
                    value={searchQuery}
                    label="Select Role"
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        {searchFields[searchType].icon}
                      </InputAdornment>
                    }
                    endAdornment={
                      searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={onClearSearch}
                            aria-label="clear search"
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }
                  >
                    {rolesOptions.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                  {!searchQuery.trim() && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      Role selection is required
                    </Typography>
                  )}
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label={searchFields[searchType].label}
                  placeholder={searchFields[searchType].placeholder}
                  variant="outlined"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleSearchKeyPress}
                  onBlur={handleSearchFieldBlur}
                  required
                  error={!searchQuery.trim() || Boolean(searchErrors[searchType])}
                  helperText={
                    !searchQuery.trim() 
                      ? `${searchFields[searchType].label} is required` 
                      : searchErrors[searchType] || ' '
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
                          onClick={onClearSearch}
                          aria-label="clear search"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={onSearch}
                startIcon={<SearchIcon />}
                disabled={!isSearchEnabled()}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Active Search Display */}
      {(searchQuery || selectedOrg || userStatus !== 'all') && (
        <Box mt={3}>
          <Alert 
            severity="info"
            icon={<FilterAltIcon />}
            sx={{ '& .MuiAlert-message': { width: '100%' } }}
          >
            <Stack 
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1} 
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              flexWrap="wrap"
              sx={{ width: '100%' }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Active filters:
              </Typography>
              
              {userStatus !== 'all' && (
                <Chip 
                  label={STATUS_CONFIG[userStatus].label} 
                  color={STATUS_CONFIG[userStatus].color}
                  icon={STATUS_CONFIG[userStatus].icon}
                  size="small"
                  sx={{ mr: { xs: 0, sm: 1 } }}
                />
              )}
              
              {searchQuery && (
                <Chip
                  icon={searchFields[searchType].icon as React.ReactElement}
                  label={`${searchFields[searchType].label}: ${searchQuery}`}
                  variant="outlined"
                  size="small"
                  sx={{ mr: { xs: 0, sm: 1 } }}
                />
              )}
              
              {selectedOrg && (
                <Chip
                  icon={<BusinessIcon />}
                  label={`Organization: ${selectedOrg.channel}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Alert>
        </Box>
      )}
    </Paper>
  );
};