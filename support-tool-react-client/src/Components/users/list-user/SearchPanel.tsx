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
  Chip
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import BusinessIcon from "@mui/icons-material/Business";
import FingerprintIcon from "@mui/icons-material/Fingerprint"; // Add for User ID
import { Organization } from "./types";
import { OrganizationSelector } from "./OrganizationSelector";

// Update search field type definitions to include userId
export type SearchFieldType = 'name' | 'email' | 'phone' | 'userId';

interface SearchFieldConfig {
  type: SearchFieldType;
  label: string;
  placeholder: string;
  path: string;
  icon: React.ReactNode;
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
  }
};

interface SearchPanelProps {
  searchQuery: string;
  searchType: SearchFieldType;
  selectedOrg: Organization | null;
  onSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onSearchTypeChange: (type: SearchFieldType) => void;
  onClearSearch: () => void;
  onOrgSelect: (org: Organization | null) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  searchQuery,
  searchType,
  selectedOrg,
  onSearch,
  onSearchQueryChange,
  onSearchTypeChange,
  onClearSearch,
  onOrgSelect
}) => {
  // State for validation
  const [searchErrors, setSearchErrors] = useState<{
    email?: string;
    phone?: string;
    userId?: string;
  }>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };
  
  // Add UUID validation
  const validateUserId = (userId: string): boolean => {
    // Standard UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(userId);
  };

  // Handler functions
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onSearchQueryChange(value);
    
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
    } else if (searchType === 'userId' && value.trim()) {
      const isValid = validateUserId(value.trim());
      setSearchErrors(prev => ({
        ...prev, 
        userId: isValid ? undefined : 'Please enter a valid UUID format'
      }));
    } else {
      // Clear errors for other search types or empty fields
      setSearchErrors({});
    }
  };

  const handleSearchTypeChange = (event: SelectChangeEvent) => {
    const newSearchType = event.target.value as SearchFieldType;
    onSearchTypeChange(newSearchType);
    setSearchErrors({});
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch();
    }
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
      }
    } else if (searchType === 'phone') {
      const isValid = validatePhone(searchQuery.trim());
      if (!isValid) {
        setSearchErrors(prev => ({
          ...prev,
          phone: 'Please enter a valid phone number (10-15 digits, may include + prefix)'
        }));
      }
    } else if (searchType === 'userId') {
      const isValid = validateUserId(searchQuery.trim());
      if (!isValid) {
        setSearchErrors(prev => ({
          ...prev,
          userId: 'Please enter a valid UUID format'
        }));
      }
    }
  };

  const handleOrgFieldBlur = () => {
    // No toast handling here, moved to parent component
  };

  return (
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
              <MenuItem value="userId">
                <Box display="flex" alignItems="center">
                  <FingerprintIcon sx={{ mr: 1 }} /> User ID
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Organization Selector - required when search type is 'name' */}
        {searchType === 'name' && (
          <Grid item xs={12} sm={4}>
            <OrganizationSelector 
              selectedOrg={selectedOrg}
              onOrgSelect={onOrgSelect}
              onBlur={handleOrgFieldBlur}
              error={searchType === 'name' && !selectedOrg && searchQuery.trim() !== ''}
            />
          </Grid>
        )}
        
        {/* Search Text Field */}
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
              (searchType === 'phone' && Boolean(searchErrors.phone)) ||
              (searchType === 'userId' && Boolean(searchErrors.userId))
            }
            helperText={
              !searchQuery.trim() ? `${searchFields[searchType].label} is required` : 
              (searchType === 'email' && searchErrors.email) ? searchErrors.email : 
              (searchType === 'phone' && searchErrors.phone) ? searchErrors.phone : 
              (searchType === 'userId' && searchErrors.userId) ? searchErrors.userId : ' '
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
        </Grid>
        
        {/* Search Button */}
        <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onSearch}
            startIcon={<SearchIcon />}
            disabled={
              !searchQuery.trim() || 
              (searchType === 'name' && !selectedOrg) ||
              (searchType === 'email' && !!searchErrors.email) ||
              (searchType === 'phone' && !!searchErrors.phone) ||
              (searchType === 'userId' && !!searchErrors.userId)
            }
            sx={{ height: '56px', mt: 0 }}
          >
            Search
          </Button>
        </Grid>
      </Grid>
      
      {/* Active Search Display */}
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
  );
};