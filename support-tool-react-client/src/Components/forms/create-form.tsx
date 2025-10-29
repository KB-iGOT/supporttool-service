import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  InputAdornment
} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { JsonEditor } from "../common-components/json-editor/json-editor";
import { FormFilterData } from "./form-filter";

interface CreateFormProps {
  loading: boolean;
  onSave: (formData: FormFilterData, jsonData: any) => Promise<void>;
  onCancel: () => void;
  formsData?: FormFilterData[];
}

export const CreateForm: React.FC<CreateFormProps> = ({
  loading,
  onSave,
  onCancel,
  formsData = []
}) => {
  const extractUniqueValues = useCallback((field: keyof FormFilterData): string[] => {
    const valuesSet = new Set(formsData.map(form => form[field]));
    const uniqueValues = Array.from(valuesSet).filter(Boolean);
    return uniqueValues as string[];
  }, [formsData]);

  const [availableOptions, setAvailableOptions] = useState({
    types: extractUniqueValues('type'),
    subtypes: extractUniqueValues('subtype'),
    actions: extractUniqueValues('action'),
    rootOrgs: extractUniqueValues('root_org'),
    components: extractUniqueValues('component'),
    frameworks: extractUniqueValues('framework')
  });

  const [dependencies, setDependencies] = useState<{
    typeToSubtype: Record<string, string[]>;
    subtypeToAction: Record<string, string[]>;
    actionToComponent: Record<string, string[]>;
    componentToFramework: Record<string, string[]>;
    frameworkToRootOrg: Record<string, string[]>;
  }>({
    typeToSubtype: {},
    subtypeToAction: {},
    actionToComponent: {},
    componentToFramework: {},
    frameworkToRootOrg: {}
  });

  const [newFormData, setNewFormData] = useState<FormFilterData>({
    root_org: "",
    framework: "",
    type: "",
    subtype: "",
    action: "",
    component: ""
  });

  const [jsonData, setJsonData] = useState<any>({});
  const [jsonIsValid, setJsonIsValid] = useState<boolean>(true);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [showValidationAlert, setShowValidationAlert] = useState<boolean>(false);
  const [validationAlertType, setValidationAlertType] = useState<'success' | 'error'>('success');
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({
    type: false,
    subtype: false,
    action: false,
    root_org: false,
    component: false,
    framework: false
  });
  const [attemptedSubmit, setAttemptedSubmit] = useState<boolean>(false);
  const [manualValidation, setManualValidation] = useState<boolean>(false);
  const isMounted = useRef(false);

  const [searchValues, setSearchValues] = useState<FormFilterData>({
    type: "",
    subtype: "",
    action: "",
    root_org: "",
    component: "",
    framework: ""
  });

  const [openDropdown, setOpenDropdown] = useState<keyof FormFilterData | null>(null);
  const [isNewValue, setIsNewValue] = useState<Record<string, boolean>>({
    type: false,
    subtype: false,
    action: false,
    root_org: false,
    component: false,
    framework: false
  });

  const searchInputRefs = {
    type: useRef<HTMLInputElement>(null),
    subtype: useRef<HTMLInputElement>(null),
    action: useRef<HTMLInputElement>(null),
    root_org: useRef<HTMLInputElement>(null),
    component: useRef<HTMLInputElement>(null),
    framework: useRef<HTMLInputElement>(null)
  };

  useEffect(() => {
    setAvailableOptions({
      types: extractUniqueValues('type'),
      subtypes: extractUniqueValues('subtype'),
      actions: extractUniqueValues('action'),
      rootOrgs: extractUniqueValues('root_org'),
      components: extractUniqueValues('component'),
      frameworks: extractUniqueValues('framework')
    });
  }, [formsData, extractUniqueValues]);

  useEffect(() => {
    const typeToSubtype: Record<string, Set<string>> = {};
    const subtypeToAction: Record<string, Set<string>> = {};
    const actionToComponent: Record<string, Set<string>> = {};
    const componentToFramework: Record<string, Set<string>> = {};
    const frameworkToRootOrg: Record<string, Set<string>> = {};

    formsData.forEach(form => {
      if (!form.type || !form.subtype || !form.action || !form.component || !form.root_org || !form.framework) {
        return;
      }

      if (!typeToSubtype[form.type]) {
        typeToSubtype[form.type] = new Set();
      }
      typeToSubtype[form.type].add(form.subtype);

      const subtypeKey = `${form.type}:${form.subtype}`;
      if (!subtypeToAction[subtypeKey]) {
        subtypeToAction[subtypeKey] = new Set();
      }
      subtypeToAction[subtypeKey].add(form.action);

      const actionKey = `${form.type}:${form.subtype}:${form.action}`;
      if (!actionToComponent[actionKey]) {
        actionToComponent[actionKey] = new Set();
      }
      actionToComponent[actionKey].add(form.component);

      const componentKey = `${form.type}:${form.subtype}:${form.action}:${form.component}`;
      if (!componentToFramework[componentKey]) {
        componentToFramework[componentKey] = new Set();
      }
      componentToFramework[componentKey].add(form.framework);

      const frameworkKey = `${form.type}:${form.subtype}:${form.action}:${form.component}:${form.framework}`;
      if (!frameworkToRootOrg[frameworkKey]) {
        frameworkToRootOrg[frameworkKey] = new Set();
      }
      frameworkToRootOrg[frameworkKey].add(form.root_org);
    });

    setDependencies({
      typeToSubtype: Object.fromEntries(
        Object.entries(typeToSubtype).map(([key, valueSet]) => [key, Array.from(valueSet)])
      ),
      subtypeToAction: Object.fromEntries(
        Object.entries(subtypeToAction).map(([key, valueSet]) => [key, Array.from(valueSet)])
      ),
      actionToComponent: Object.fromEntries(
        Object.entries(actionToComponent).map(([key, valueSet]) => [key, Array.from(valueSet)])
      ),
      componentToFramework: Object.fromEntries(
        Object.entries(componentToFramework).map(([key, valueSet]) => [key, Array.from(valueSet)])
      ),
      frameworkToRootOrg: Object.fromEntries(
        Object.entries(frameworkToRootOrg).map(([key, valueSet]) => [key, Array.from(valueSet)])
      )
    });
  }, [formsData]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (openDropdown && searchInputRefs[openDropdown]?.current) {
      const timer = setTimeout(() => {
        searchInputRefs[openDropdown]?.current?.focus();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [openDropdown]);

  const handleDropdownOpen = (field: keyof FormFilterData) => {
    setOpenDropdown(field);
    setSearchValues(prev => ({
      ...prev,
      [field]: ""
    }));
  };

  const handleDropdownClose = () => {
    setOpenDropdown(null);
  };

  const handleSearchChange = (value: string, field: keyof FormFilterData) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: value || ""
    }));

    const availableFieldOptions = getOptionsForField(field);
    const searchText = value || "";
    const valueExists = availableFieldOptions.some(option => 
      option.toLowerCase() === searchText.toLowerCase()
    );

    setIsNewValue(prev => ({
      ...prev,
      [field]: searchText.trim() !== "" && !valueExists
    }));
  };

  const clearSearch = (field: keyof FormFilterData) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: ""
    }));
    setIsNewValue(prev => ({
      ...prev,
      [field]: false
    }));
    searchInputRefs[field]?.current?.focus();
  };

  const getOptionsForField = (field: keyof FormFilterData): string[] => {
    switch(field) {
      case 'type':
        return availableOptions.types;
      
      case 'subtype': {
        const selectedType = newFormData.type;
        if (!selectedType) {
          return availableOptions.subtypes;
        }
        
        return dependencies.typeToSubtype[selectedType] || [];
      }
      
      case 'action': {
        const { type, subtype } = newFormData;
        if (!type || !subtype) {
          return availableOptions.actions;
        }
        
        const subtypeKey = `${type}:${subtype}`;
        return dependencies.subtypeToAction[subtypeKey] || [];
      }
      
      case 'component': {
        const { type, subtype, action } = newFormData;
        if (!type || !subtype || !action) {
          return availableOptions.components;
        }
        
        const actionKey = `${type}:${subtype}:${action}`;
        return dependencies.actionToComponent[actionKey] || [];
      }
      
      case 'framework': {
        const { type, subtype, action, component } = newFormData;
        if (!type || !subtype || !action || !component) {
          return availableOptions.frameworks;
        }
        
        const componentKey = `${type}:${subtype}:${action}:${component}`;
        return dependencies.componentToFramework[componentKey] || [];
      }
      
      case 'root_org': {
        const { type, subtype, action, component, framework } = newFormData;
        if (!type || !subtype || !action || !component || !framework) {
          return availableOptions.rootOrgs;
        }
        
        const frameworkKey = `${type}:${subtype}:${action}:${component}:${framework}`;
        return dependencies.frameworkToRootOrg[frameworkKey] || [];
      }
      
      default:
        return [];
    }
  };

  const handleSelectChange = (value: string, field: keyof FormFilterData) => {
    setNewFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      switch(field) {
        case 'type':
          updated.subtype = "";
          updated.action = "";
          updated.component = "";
          updated.framework = "";
          updated.root_org = "";
          break;
          
        case 'subtype':
          updated.action = "";
          updated.component = "";
          updated.framework = "";
          updated.root_org = "";
          break;
          
        case 'action':
          updated.component = "";
          updated.framework = "";
          updated.root_org = "";
          break;
          
        case 'component':
          updated.framework = "";
          updated.root_org = "";
          break;
          
        case 'framework':
          updated.root_org = "";
          break;
          
        case 'root_org':
          break;
      }
      
      return updated;
    });

    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));

    setSearchValues(prev => ({
      ...prev,
      [field]: ""
    }));
    setIsNewValue(prev => ({
      ...prev,
      [field]: false
    }));

    setOpenDropdown(null);
  };

  const handleAddNewValue = (field: keyof FormFilterData) => {
    const newValue = searchValues[field]?.trim() || "";

    if (newValue) {
      setNewFormData(prev => {
        const updated = {
          ...prev,
          [field]: newValue
        };
        
        switch(field) {
          case 'type':
            updated.subtype = "";
            updated.action = "";
            updated.component = "";
            updated.framework = "";
            updated.root_org = "";
            break;
            
          case 'subtype':
            updated.action = "";
            updated.component = "";
            updated.framework = "";
            updated.root_org = "";
            break;
            
          case 'action':
            updated.component = "";
            updated.framework = "";
            updated.root_org = "";
            break;
            
          case 'component':
            updated.framework = "";
            updated.root_org = "";
            break;
            
          case 'framework':
            updated.root_org = "";
            break;
            
          case 'root_org':
            break;
        }
        
        return updated;
      });

      setTouchedFields(prev => ({
        ...prev,
        [field]: true
      }));

      setAvailableOptions(prev => {
        const fieldKey = field === 'root_org' 
          ? 'rootOrgs' 
          : `${field}s` as keyof typeof prev;
        
        return {
          ...prev,
          [fieldKey]: [...(prev[fieldKey] as string[] || []), newValue]
        };
      });

      if (field === 'type') {
        setDependencies(prev => ({
          ...prev,
          typeToSubtype: {
            ...prev.typeToSubtype,
            [newValue]: []
          }
        }));
      } else if (field === 'subtype' && newFormData.type) {
        setDependencies(prev => ({
          ...prev,
          subtypeToAction: {
            ...prev.subtypeToAction,
            [`${newFormData.type}:${newValue}`]: []
          }
        }));
      } else if (field === 'action' && newFormData.type && newFormData.subtype) {
        setDependencies(prev => ({
          ...prev,
          actionToComponent: {
            ...prev.actionToComponent,
            [`${newFormData.type}:${newFormData.subtype}:${newValue}`]: []
          }
        }));
      } else if (field === 'component' && newFormData.type && newFormData.subtype && newFormData.action) {
        setDependencies(prev => ({
          ...prev,
          componentToFramework: {
            ...prev.componentToFramework,
            [`${newFormData.type}:${newFormData.subtype}:${newFormData.action}:${newValue}`]: []
          }
        }));
      } else if (field === 'framework' && newFormData.type && newFormData.subtype && newFormData.action && newFormData.component) {
        setDependencies(prev => ({
          ...prev,
          frameworkToRootOrg: {
            ...prev.frameworkToRootOrg,
            [`${newFormData.type}:${newFormData.subtype}:${newFormData.action}:${newFormData.component}:${newValue}`]: []
          }
        }));
      }

      setSearchValues(prev => ({
        ...prev,
        [field]: ""
      }));
      setIsNewValue(prev => ({
        ...prev,
        [field]: false
      }));

      setOpenDropdown(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setNewFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleJsonChange = (newData: any) => {
    setJsonData(newData);
  };

  const validateJson = (showMessage: boolean = false) => {
    try { 
      if (jsonData === null || jsonData === undefined) {
        throw new Error("JSON data cannot be null or undefined");
      }

      if ((Array.isArray(jsonData) || typeof jsonData === 'object')) {
        // Check if the object or array is empty
        const isEmpty = Array.isArray(jsonData) 
          ? jsonData.length === 0 
          : Object.keys(jsonData).length === 0;
        
        if (isEmpty) {
          throw new Error("JSON data cannot be empty");
        }
        
        setJsonIsValid(true);
        setJsonValidationError(null);

        if (showMessage) {
          setValidationAlertType('success');
          setShowValidationAlert(true);

          const timer = setTimeout(() => {
            if (isMounted.current) {
              setShowValidationAlert(false);
            }
          }, 3000);

          return () => clearTimeout(timer);
        }
      } else {
        throw new Error("JSON data must be an object or array");
      }
    } catch (error: any) {
      setJsonIsValid(false);
      setJsonValidationError(error.message || "Invalid JSON data");

      if (showMessage) {
        setValidationAlertType('error');
        setShowValidationAlert(true);
      }
    }
  };

  const handleValidateClick = () => {
    validateJson(true);
  };

  const isFormValid = () => {
    
    return (
      jsonIsValid &&
      newFormData.type?.trim() !== "" &&
      newFormData.subtype?.trim() !== "" &&
      newFormData.action?.trim() !== "" &&
      newFormData.root_org?.trim() !== "" &&
      newFormData.component?.trim() !== "" &&
      newFormData.framework?.trim() !== ""
    );
  };

  const shouldShowError = (fieldName: keyof FormFilterData) => {
    return (touchedFields[fieldName] || attemptedSubmit) && 
      (newFormData[fieldName] === undefined || newFormData[fieldName]?.trim() === "");
  };

  const handleSave = async () => {
    setAttemptedSubmit(true);
    
    // Validate JSON before saving
    validateJson(false);
    
    // Wait a bit for validation state to update
    setTimeout(() => {
      if (isFormValid()) {
        onSave(newFormData, jsonData);
      } else if (!jsonIsValid) {
        setValidationAlertType('error');
        setShowValidationAlert(true);
      }
    }, 100);
  };

  const getFilteredOptions = (field: keyof FormFilterData): string[] => {
    const options = getOptionsForField(field);
    const searchText = (searchValues[field] || "").toLowerCase();
    
    if (!searchText) {
      return options;
    }
    
    return options.filter(option => 
      option.toLowerCase().includes(searchText)
    );
  };

  const renderSearchableDropdown = (
    field: keyof FormFilterData, 
    label: string
  ) => {
    const filteredOptions = getFilteredOptions(field);
    const isNew = isNewValue[field];
    
    let isDisabled = false;
    let dependencyMessage = "";
    
    switch(field) {
      case 'subtype':
        isDisabled = !newFormData.type;
        dependencyMessage = isDisabled ? "Select Type first" : "";
        break;
      case 'action':
        isDisabled = !newFormData.type || !newFormData.subtype;
        dependencyMessage = isDisabled ? "Select Type and Subtype first" : "";
        break;
      case 'component':
        isDisabled = !newFormData.type || !newFormData.subtype || !newFormData.action;
        dependencyMessage = isDisabled ? "Select Type, Subtype, and Action first" : "";
        break;
      case 'framework':
        isDisabled = !newFormData.type || !newFormData.subtype || !newFormData.action || !newFormData.component;
        dependencyMessage = isDisabled ? "Select Type, Subtype, Action, and Component first" : "";
        break;
      case 'root_org':
        isDisabled = !newFormData.type || !newFormData.subtype || !newFormData.action || !newFormData.component || !newFormData.framework;
        dependencyMessage = isDisabled ? "Select all previous fields first" : "";
        break;
    }

    return (
      <Grid item xs={12} md={4}>
        <FormControl fullWidth required disabled={isDisabled}>
          <InputLabel id={`${field}-label`}>{label}</InputLabel>
          
          <Select
            labelId={`${field}-label`}
            id={`${field}-select`}
            value={newFormData[field]}
            label={label}
            error={shouldShowError(field)}
            onChange={(e) => handleSelectChange(e.target.value, field)}
            renderValue={(selected) => selected || `Select ${label}`}
            open={openDropdown === field}
            onOpen={() => !isDisabled && handleDropdownOpen(field)}
            onClose={handleDropdownClose}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key !== 'Tab') {
                e.preventDefault();
              }
            }}
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 300 },
                sx: {
                  '& .MuiMenuItem-root:hover': {
                    backgroundColor: 'transparent',
                  }
                }
              },
              autoFocus: false,
              disableAutoFocusItem: true,
              disableScrollLock: true
            }}
          >
            {isDisabled ? (
              <MenuItem disabled>
                {dependencyMessage}
              </MenuItem>
            ) : (
              <>
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
                    placeholder={`Search or enter new ${label}...`}
                    fullWidth
                    value={searchValues[field]}
                    autoComplete="off"
                    inputProps={{
                      onInput: (e: React.FormEvent<HTMLInputElement>) => {
                        e.stopPropagation();
                        const target = e.target as HTMLInputElement;
                        handleSearchChange(target.value, field);
                      }
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Escape') {
                        handleDropdownClose();
                      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                      } else if (e.key === 'Enter' && isNew) {
                        e.preventDefault();
                        handleAddNewValue(field);
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
                
                {isNew && searchValues[field].trim() !== "" && (
                  <MenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddNewValue(field);
                    }}
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.2)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <AddCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Typography>
                        Add new: <strong>{searchValues[field]}</strong>
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                
                {filteredOptions.length === 0 && !isNew && (
                  <MenuItem disabled>
                    {searchValues[field] ? 
                      "No matches found - type to create new value" : 
                      "No options available - type to create new value"}
                  </MenuItem>
                )}
                
                {filteredOptions.map((option:any) => (
                  <MenuItem 
                    key={option} 
                    value={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectChange(option, field);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
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
                ))}
              </>
            )}
          </Select>
          {shouldShowError(field) && (
            <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 1.5 }}>
              {label} is required
            </Typography>
          )}
          {!isDisabled && filteredOptions.length > 0 && field !== 'type' && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
              {filteredOptions.length} options based on your previous selections
            </Typography>
          )}
        </FormControl>
      </Grid>
    );
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Form Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new form configuration
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onCancel}
          disabled={loading}
        >
          Back to Form Filter
        </Button>
      </Box>
      
      <Collapse in={showValidationAlert} sx={{ mb: 2 }}>
        <Alert
          severity={validationAlertType}
          icon={validationAlertType === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowValidationAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {validationAlertType === 'success' 
            ? "JSON is valid and ready to save."
            : `JSON validation error: ${jsonValidationError}`
          }
        </Alert>
      </Collapse>
      
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Form Parameters</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Search existing values or enter new ones. All fields are required.
          </Alert>
          
          <Grid container spacing={3}>
            {renderSearchableDropdown('type', 'Type')}
            {renderSearchableDropdown('subtype', 'Subtype')}
            {renderSearchableDropdown('action', 'Action')}
            {renderSearchableDropdown('component', 'Component')}
            {renderSearchableDropdown('framework', 'Framework')}
            {renderSearchableDropdown('root_org', 'Root Organization')}
          </Grid>
        </CardContent>
      </Card>
      
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Form Configuration Editor (New Form)</Typography>
            <Box display="flex" gap={2}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleValidateClick}
                disabled={loading}
              >
                Validate JSON
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave}
                disabled={loading || (attemptedSubmit && !isFormValid())}
                startIcon={<SaveIcon />}
              >
                Save Configuration
              </Button>
            </Box>
          </Box>
          
          <JsonEditor 
            input={jsonData} 
            onChange={handleJsonChange}
          />
        </CardContent>
      </Card>
    </>
  );
};