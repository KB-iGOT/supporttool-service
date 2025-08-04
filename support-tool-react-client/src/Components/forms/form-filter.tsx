import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  FormControl, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Select, 
  Typography, 
  Chip,
  Divider,
  TextField,
  InputAdornment,
  ListSubheader
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export interface FormFilterData {
  root_org: string;
  framework: string;
  type: string;
  subtype: string;
  action: string;
  component: string;
}

interface FormFilterProps {
  loading: boolean;
  onSearch: (filterData: FormFilterData) => void;
  formsData: FormFilterData[];
  selectedFilter?: FormFilterData | null;
  // New prop to notify parent of filter changes
  onFilterChange?: () => void;
}

export const FormFilter: React.FC<FormFilterProps> = ({ 
  loading, 
  onSearch, 
  formsData,
  selectedFilter,
  onFilterChange 
}) => {
  // Search filters for each dropdown
  const [searchValues, setSearchValues] = useState<FormFilterData>({
    type: "",
    subtype: "",
    action: "",
    root_org: "",
    component: "",
    framework: ""
  });
  
  // Selected filter values
  const [selectedValues, setSelectedValues] = useState<FormFilterData>({
    type: "",
    subtype: "",
    action: "",
    root_org: "",
    component: "",
    framework: ""
  });
  
  // Available options for each filter
  const [filterOptions, setFilterOptions] = useState<{
    type: string[];
    subtype: string[];
    action: string[];
    root_org: string[];
    component: string[];
    framework: string[];
  }>({
    type: [],
    subtype: [],
    action: [],
    root_org: [],
    component: [],
    framework: []
  });
  
  // Track which dropdown is currently open
  const [openDropdown, setOpenDropdown] = useState<keyof FormFilterData | null>(null);
  
  // References to search input elements
  const searchInputRefs = {
    type: useRef<HTMLInputElement>(null),
    subtype: useRef<HTMLInputElement>(null),
    action: useRef<HTMLInputElement>(null),
    root_org: useRef<HTMLInputElement>(null),
    component: useRef<HTMLInputElement>(null),
    framework: useRef<HTMLInputElement>(null)
  };
  
  // References to select elements
  const selectRefs = {
    type: useRef<HTMLInputElement>(null),
    subtype: useRef<HTMLInputElement>(null),
    action: useRef<HTMLInputElement>(null),
    root_org: useRef<HTMLInputElement>(null),
    component: useRef<HTMLInputElement>(null),
    framework: useRef<HTMLInputElement>(null)
  };
  
  // Apply selected filter when it changes
  useEffect(() => {
    if (selectedFilter) {
      setSelectedValues(selectedFilter);
    }
  }, [selectedFilter]);
  
  // Update available options whenever form data or selections change
  useEffect(() => {
    updateFilterOptions();
  }, [formsData, selectedValues]);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (openDropdown && searchInputRefs[openDropdown]?.current) {
      const timer = setTimeout(() => {
        // Non-null assertion operator after checking existence
        const inputRef = searchInputRefs[openDropdown];
        if (inputRef?.current) {
          searchInputRefs[openDropdown]!.current!.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [openDropdown]);
  
  const updateFilterOptions = useCallback(() => {
    if (!formsData || formsData.length === 0) return;
    
    // Filter data based on current selections
    const getFilteredData = () => {
      return formsData.filter(item => {
        if (selectedValues.type && item.type !== selectedValues.type) return false;
        if (selectedValues.subtype && item.subtype !== selectedValues.subtype) return false;
        if (selectedValues.action && item.action !== selectedValues.action) return false;
        if (selectedValues.component && item.component !== selectedValues.component) return false;
        if (selectedValues.framework && item.framework !== selectedValues.framework) return false;
        if (selectedValues.root_org && item.root_org !== selectedValues.root_org) return false;
        return true;
      });
    };
    
    // Get unique values for a field
    const getUniqueValues = (field: keyof FormFilterData) => {
      const filtered = getFilteredData();
      const uniqueSet = new Set<string>();
      
      filtered.forEach(item => {
        if (item[field]) uniqueSet.add(item[field]);
      });
      
      return Array.from(uniqueSet).sort();
    };
    
    // Special case for the first dropdown (type)
    const types = Array.from(new Set(formsData.map(item => item.type))).sort();
    
    // For other dropdowns, filter based on previous selections
    const subtypes = selectedValues.type ? 
      getUniqueValues('subtype') : [];
      
    const actions = selectedValues.type && selectedValues.subtype ? 
      getUniqueValues('action') : [];
      
    const components = selectedValues.type && selectedValues.subtype && selectedValues.action ? 
      getUniqueValues('component') : [];
      
    const frameworks = selectedValues.type && selectedValues.subtype && 
                     selectedValues.action && selectedValues.component ? 
      getUniqueValues('framework') : [];
      
    const rootOrgs = selectedValues.type && selectedValues.subtype && 
                   selectedValues.action && selectedValues.component && 
                   selectedValues.framework ? 
      getUniqueValues('root_org') : [];
    
    setFilterOptions({
      type: types,
      subtype: subtypes,
      action: actions,
      component: components,
      framework: frameworks,
      root_org: rootOrgs
    });
  }, [formsData, selectedValues]);
  
  // Handle dropdown selection changes
  const handleSelectChange = (value: string, field: keyof FormFilterData) => {
    // Reset all subsequent selections
    const resetSelections = (startField: keyof FormFilterData) => {
      const fields: (keyof FormFilterData)[] = [
        'type', 
        'subtype', 
        'action', 
        'component', 
        'framework', 
        'root_org'
      ];
      const startIndex = fields.indexOf(startField);
      
      const resetValues = { ...selectedValues };
      const resetSearchValues = { ...searchValues };
      
      for (let i = startIndex + 1; i < fields.length; i++) {
        resetValues[fields[i]] = "";
        resetSearchValues[fields[i]] = "";
      }
      
      setSearchValues(resetSearchValues);
      return resetValues;
    };
    
    // Update selected value and reset subsequent selections
    setSelectedValues(prev => {
      const resetValues = resetSelections(field);
      return { ...resetValues, [field]: value };
    });
    
    // Notify parent component that filters have changed to hide the editor
    if (onFilterChange) {
      onFilterChange();
    }
    
    // Close the dropdown
    setOpenDropdown(null);
  };
  
  // Handle dropdown open state
  const handleDropdownOpen = (field: keyof FormFilterData) => {
    setOpenDropdown(field);
    
    // Clear search text immediately
    setSearchValues(prev => ({
      ...prev,
      [field]: ""
    }));
    
    // Try to focus immediately as well (backup to the useEffect)
    setTimeout(() => {
      const inputRef = searchInputRefs[field];
      if (inputRef && inputRef.current) {
        searchInputRefs[field]!.current!.focus();
      }
    }, 10);
  };
  
  // Handle dropdown close
  const handleDropdownClose = () => {
    setOpenDropdown(null);
  };
  
  // Handle search input changes without losing focus
  const handleSearchChange = (value: string, field: keyof FormFilterData) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Clear search for a specific field
  const clearSearch = (field: keyof FormFilterData) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: ""
    }));
    // Refocus the input after clearing
    searchInputRefs[field]?.current?.focus();
  };
  
  // Filter options based on search value
  const getFilteredOptions = (field: keyof FormFilterData, options: string[]) => {
    const searchValue = searchValues[field].toLowerCase();
    if (!searchValue) return options;
    
    return options.filter(option => 
      option.toLowerCase().includes(searchValue)
    );
  };
  
  // Handle form reset
  const handleReset = () => {
    setSelectedValues({
      type: "",
      subtype: "",
      action: "",
      root_org: "",
      component: "",
      framework: ""
    });
    
    setSearchValues({
      type: "",
      subtype: "",
      action: "",
      root_org: "",
      component: "",
      framework: ""
    });
    
    // Notify parent component that filters have been reset
    if (onFilterChange) {
      onFilterChange();
    }
  };
  
  // Check if search button should be enabled
  const isSearchEnabled = () => {
    return selectedValues.type && 
           selectedValues.subtype && 
           selectedValues.action && 
           selectedValues.root_org &&
           selectedValues.component &&
           selectedValues.framework;
  };
  
  // Handle search button click
  const handleSearch = () => {
    onSearch(selectedValues);
  };
  
  // Create a custom dropdown with search that doesn't highlight while typing
  const renderDropdown = (
    field: keyof FormFilterData, 
    label: string, 
    options: string[],
    disabled: boolean = false,
    required: boolean = true
  ) => {
    const filteredOptions = getFilteredOptions(field, options);
    
    return (
      <Grid item xs={12} md={4}>
        <FormControl fullWidth required={required} disabled={disabled}>
          <InputLabel id={`${field}-label`}>{label}</InputLabel>
          
          <Select
            labelId={`${field}-label`}
            id={`${field}-select`}
            inputRef={selectRefs[field]}
            value={selectedValues[field]}
            label={label}
            onChange={(e) => handleSelectChange(e.target.value, field)}
            renderValue={(selected) => selected}
            open={openDropdown === field}
            onOpen={() => {
              handleDropdownOpen(field);
              
              // Focus with a small delay to ensure dropdown is open
              setTimeout(() => {
                const inputRef = searchInputRefs[field];
                if (inputRef?.current) {
                  inputRef.current.focus();
                }
              }, 50);
            }}
            onClose={handleDropdownClose}
            // Block keyboard events from activating default MUI behaviors
            onKeyDown={(e) => {
              e.stopPropagation();
              // Only allow Tab to work normally for accessibility
              if (e.key !== 'Tab') {
                e.preventDefault();
              }
            }}
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 300 },
                // Override the pointer events to prevent selection on mouse hover
                sx: {
                  '& .MuiMenuItem-root:hover': {
                    backgroundColor: 'transparent',
                  }
                }
              },
              // Critical settings to prevent default highlighting behaviors
              autoFocus: false,
              disableAutoFocusItem: true,
              disableScrollLock: true
            }}
          >
            {/* Custom search header that isolates events */}
            <ListSubheader 
              sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 1, 
                position: 'sticky', 
                top: 0, 
                zIndex: 100
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <TextField
                size="small"
                inputRef={searchInputRefs[field]}
                placeholder={`Search ${label}...`}
                fullWidth
                value={searchValues[field]}
                autoComplete="off"
                // Direct input access through the DOM
                inputProps={{
                  // Handle input directly to avoid React synthetic events
                  onInput: (e: React.FormEvent<HTMLInputElement>) => {
                    e.stopPropagation();
                    const target = e.target as HTMLInputElement;
                    handleSearchChange(target.value, field);
                  }
                }}
                // Prevent keyboard events from bubbling to Select component
                onKeyDown={(e) => {
                  e.stopPropagation();
                  // Only allow Escape to close dropdown
                  if (e.key === 'Escape') {
                    handleDropdownClose();
                  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    // Prevent arrow keys from navigating the dropdown
                    e.preventDefault();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onBlur={(e) => e.stopPropagation()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchValues[field] ? (
                    <InputAdornment position="end">
                      <ClearIcon 
                        fontSize="small" 
                        sx={{ cursor: 'pointer' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearSearch(field);
                        }}
                      />
                    </InputAdornment>
                  ) : null
                }}
              />
            </ListSubheader>
            
            {/* Empty option */}
            {/* <MenuItem 
              value=""
              onClick={(e) => {
                e.stopPropagation();
                handleSelectChange("", field);
              }}
              // Prevent keyboard events
              onKeyDown={(e) => e.stopPropagation()}
            >
              <em>Select {label}</em>
            </MenuItem> */}
            
            {/* Show a message when no results found */}
            {filteredOptions.length === 0 ? (
              <MenuItem disabled>No matches found</MenuItem>
            ) : (
              // Map through filtered options
              filteredOptions.map((option) => (
                <MenuItem 
                  key={option} 
                  value={option}
                  // Use direct click handler instead of relying on onChange
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectChange(option, field);
                  }}
                  // Block keyboard events
                  onKeyDown={(e) => e.stopPropagation()}
                  // Disable default MUI behavior that causes highlighting
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    // Remove the default active/focused styling
                    '&.Mui-focusVisible': {
                      backgroundColor: 'transparent',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                  }}
                >
                  {option}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Grid>
    );
  };
  
  return (
    <Card elevation={2}>
      <CardContent>
        <Grid container spacing={3}>
          {/* Type Selection - with search */}
          {renderDropdown('type', 'Type', filterOptions.type)}
          
          {/* Subtype Selection - with search */}
          {renderDropdown('subtype', 'Subtype', filterOptions.subtype, !selectedValues.type)}
          
          {/* Action Selection - with search */}
          {renderDropdown('action', 'Action', filterOptions.action, !selectedValues.subtype)}
          
          {/* Component Selection - with search */}
          {renderDropdown('component', 'Component', filterOptions.component, !selectedValues.action)}
          
          {/* Framework Selection - with search */}
          {renderDropdown('framework', 'Framework', filterOptions.framework, !selectedValues.component)}
          
          {/* Root Org Selection - with search */}
          {renderDropdown('root_org', 'Root Organization', filterOptions.root_org, !selectedValues.framework)}
        </Grid>
        
        {/* Selected Values Summary */}
        {Object.values(selectedValues).some(value => value) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="subtitle2" gutterBottom>Selected Parameters:</Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {Object.entries(selectedValues).map(([key, value]) => 
                  value ? (
                    <Chip 
                      key={key} 
                      label={`${key}: ${value}`} 
                      color="primary" 
                      variant="outlined" 
                    />
                  ) : null
                )}
              </Box>
              
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={handleReset}
                  disabled={!Object.values(selectedValues).some(value => value) || loading}
                >
                  Reset
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={!isSearchEnabled() || loading}
                  onClick={handleSearch}
                >
                  Find Configuration
                </Button>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};