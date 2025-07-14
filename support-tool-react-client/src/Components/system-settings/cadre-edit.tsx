import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Card,
  CardContent,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  createTheme,
  ThemeProvider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { systemSettingsService } from '../../services/system-settings.service';
import { useNavigate, useParams } from 'react-router-dom';

// Type definitions based on the JSON structure
interface Cadre {
  id: string;
  name: string;
  startBatchYear: number;
  endBatchYear: number;
  exculsionYearList: number[];
}

interface Service {
  id: string;
  name: string;
  displayName: string;
  cadreControllingAuthority: string;
  commonBatchStartYear: number;
  commonBatchEndYear: number;
  commonBatchExclusionYearList: number[];
  cadreList: Cadre[];
}

interface CivilServiceType {
  name: string;
  displayName: string;
  id: string;
  serviceList: Service[];
}

interface CivilServiceTypeRoot {
  name: string;
  displayName: string;
  civilServiceTypeList: CivilServiceType[];
}

interface FormDataStructure {
  civilServiceType: CivilServiceTypeRoot;
}

// Debounce utility function to prevent double execution
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Example initial data structure
const defaultInitialData: FormDataStructure = {
  civilServiceType: {
    name: "",
    displayName: "",
    civilServiceTypeList: []
  }
};

// Custom style variables for visual differentiation
const styles = {
  civilServiceType: {
    backgroundColor: '#f5f5f5',
    borderLeft: '4px solid #3f51b5'
  },
  service: {
    backgroundColor: '#e8f5e9',
    borderLeft: '4px solid #4caf50'
  },
  cadre: {
    backgroundColor: '#fff3e0',
    borderLeft: '4px solid #ff9800'
  }
};

// Theme with white background for TextFields
const theme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
          }
        }
      }
    }
  }
});

export const CadreEdit: React.FC = () => {
  // Get ID from URL params
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use useRef for active element tracking to restore focus
  const activeElementRef = useRef<HTMLElement | null>(null);
  const activeFieldPathRef = useRef<string | null>(null);
  
  // Use refs to track last operation timestamp
  const lastOperationTimestamps = useRef<Record<string, number>>({});
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);
  const [configData, setConfigData] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  
  // Form state
  const [formData, setFormData] = useState<FormDataStructure>(defaultInitialData);
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [exclusionYearDialogOpen, setExclusionYearDialogOpen] = useState<boolean>(false);
  const [currentExclusionYears, setCurrentExclusionYears] = useState<{
    years: number[];
    path: string[];
  }>({ years: [], path: [] });
  const [newExclusionYear, setNewExclusionYear] = useState<string>('');
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  
  // Helper to save active element before state changes
  const saveActiveElement = useCallback(() => {
    activeElementRef.current = document.activeElement as HTMLElement;
    if (activeElementRef.current?.dataset?.path) {
      activeFieldPathRef.current = activeElementRef.current.dataset.path;
    }
  }, []);

  // Fetch configuration data from API
  const getConfigData = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await systemSettingsService.getConfig(id);
      console.log("API Response:", response);
      
      if (response && response.responseCode === "OK") {
        setConfigData(response.result.response);
        
        // Check if the value is valid JSON or already a JSON object
        try {
          let parsedValue;
          
          if (typeof response.result.response.value === "string") {
            // If it's a string, parse it to get the JSON object
            parsedValue = JSON.parse(response.result.response.value);
          } else {
            // If it's already an object, use it directly
            parsedValue = response.result.response.value;
          }
          
          console.log("Setting form data to:", parsedValue);
          
          // Set the form data
          setFormData(parsedValue);
          
          // Initialize accordion states for existing items - DEFAULT ALL TO FALSE
          const initialAccordionStates: Record<string, boolean> = {};
          
          // Process all civil service types
          parsedValue.civilServiceType.civilServiceTypeList?.forEach((cst: CivilServiceType) => {
            if (cst.id) initialAccordionStates[cst.id] = false; // DEFAULT TO FALSE
            
            // Process all services within this civil service type
            cst.serviceList?.forEach((service: Service) => {
              if (service.id) initialAccordionStates[service.id] = false; // DEFAULT TO FALSE
              
              // Process all cadres within this service
              service.cadreList?.forEach((cadre: Cadre) => {
                if (cadre.id) initialAccordionStates[cadre.id] = false; // DEFAULT TO FALSE
              });
            });
          });
          
          setExpandedAccordions(initialAccordionStates);
          
        } catch (parseError) {
          console.error("Error parsing configuration value:", parseError);
          setError("The configuration value is not valid JSON");
        }
      } else {
        setError(response?.responseMessage || "Failed to load configuration");
      }
    } catch (err) {
      console.error("Error fetching configuration:", err);
      setError("Failed to load configuration data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Add a flag to avoid calling getConfigData twice
    const fetchData = async () => {
      if (!id) return;
      // Check if we already have data to avoid unnecessary API calls
      if (configData && configData.id === id) return;
      
      await getConfigData();
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); 

  // Helper to restore focus after render
  React.useLayoutEffect(() => {
    if (activeFieldPathRef.current) {
      const element = document.querySelector(`[data-path="${activeFieldPathRef.current}"]`);
      if (element && element instanceof HTMLElement) {
        element.focus();
      }
      // Clear reference after attempting to restore focus
      activeFieldPathRef.current = null;
    }
  });

  // Toggle accordion expansion
  const handleAccordionChange = useCallback((accordionId: string, index: number, type: string) => 
    (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedAccordions(prev => ({
        ...prev,
        [`${type}-${index}`]: isExpanded,
        [accordionId]: isExpanded  // Keep both location-based and ID-based references
      }));
    }, []);

  // Helper function to set values in nested objects
  const setNestedValue = useCallback((obj: any, path: string[], value: any): any => {
    const newObj = { ...obj };
    let current = newObj;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        current[path[i]] = isNaN(parseInt(path[i + 1])) ? {} : [];
      }
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    return newObj;
  }, []);

  // Handle input field changes
  const handleChange = useCallback((path: string[], value: any) => {
    // Save active element before state update
    saveActiveElement();
    
    // Check if we're modifying an ID field
    const isIdField = path.length > 0 && path[path.length - 1] === "id";
    let oldId :any= null;
    
    if (isIdField) {
      // Get the current ID before changing it
      try {
        let current: any = formData;
        for (let i = 0; i < path.length - 1; i++) {
          if (current[path[i]] === undefined) break;
          current = current[path[i]];
        }
        oldId = current.id;
      } catch (err) {
        console.error("Error getting old ID:", err);
      }
    }
    
    setFormData(prevData => {
      // Use functional state update to ensure we're working with latest state
      const updatedData = setNestedValue(prevData, path, value);
      
      // If we're changing an ID and the accordion was expanded, update the expanded state
      if (isIdField && oldId && expandedAccordions[oldId] && value) {
        // Update in next tick to ensure render completes first
        setTimeout(() => {
          setExpandedAccordions(prev => {
            const newState = { ...prev };
            // Remove old ID's expanded state
            delete newState[oldId];
            // Set new ID's expanded state to true
            newState[value] = true;
            return newState;
          });
        }, 0);
      }
      
      return updatedData;
    });
  }, [setNestedValue, saveActiveElement, formData, expandedAccordions]);

  const addItem = useCallback((path: string[], template: any) => {
    // Create a unique key for this operation
    const operationKey = path.join('.');
    const now = Date.now();
    
    // Check if this operation was executed recently (within 1 second)
    if ((lastOperationTimestamps.current[operationKey] || 0) > now - 1000) {
      console.log(`Skipping duplicate add for ${operationKey} - too soon since last operation`);
      return;
    }
    
    // Record this operation timestamp
    lastOperationTimestamps.current[operationKey] = now;
    console.log(`Adding new item to ${operationKey} at ${now}`);
    
    // Save active element for focus restoration
    saveActiveElement();
    
    // Create deep copy of template with empty values
    const emptyTemplate = JSON.parse(JSON.stringify(template));
    
    // Update form data and generate incremental ID
    setFormData(prevData => {
      try {
        // Navigate to the array in the data structure
        let current: any = JSON.parse(JSON.stringify(prevData)); // Create deep copy
        let parent = current;
        let finalKey = '';
        
        for (let i = 0; i < path.length; i++) {
          const key = path[i];
          finalKey = key;
          
          if (i === path.length - 1) {
            // We're at the target path
            break;
          }
          
          // Create nested structure if it doesn't exist
          if (!parent[key]) {
            parent[key] = isNaN(parseInt(path[i + 1])) ? {} : [];
          }
          parent = parent[key];
        }
        
        // Ensure the target is an array
        if (!Array.isArray(parent[finalKey])) {
          console.error('Target is not an array:', path);
          parent[finalKey] = []; // Create an array if it doesn't exist
        }
        
        // Generate incremental ID based on existing IDs with THREE-DIGIT format
        if (emptyTemplate.id && typeof emptyTemplate.id === 'string' && emptyTemplate.id.includes('-')) {
          const prefix = emptyTemplate.id.split('-')[0]; // Now will get "cs" for services
          let highestId = 0;
          
          // Find the highest existing ID with the same prefix
          parent[finalKey].forEach((item: any) => {
            if (item.id && typeof item.id === 'string' && item.id.startsWith(prefix)) {
              const parts = item.id.split('-');
              if (parts.length > 1) {
                const idNum = parseInt(parts[1]);
                if (!isNaN(idNum) && idNum > highestId) {
                  highestId = idNum;
                }
              }
            }
          });
          
          // Set the new ID with incremented number in THREE-DIGIT format
          const nextId = highestId + 1;
          emptyTemplate.id = `${prefix}-${nextId.toString().padStart(3, '0')}`;
        }
        
        // Add the new item to the array
        parent[finalKey].push(emptyTemplate);
        
        return current;
      } catch (error) {
        console.error('Error in add operation:', error);
        return prevData; // Return unchanged data on error
      }
    });
    
    // Store the new ID for accordion expansion (using a ref to avoid state updates)
    const newItemId = emptyTemplate.id;
    
    // Auto-expand newly added accordion after delay to ensure rendering is complete
    if (newItemId) {
      setTimeout(() => {
        setExpandedAccordions(prev => ({
          ...prev,
          [newItemId]: true
        }));
      }, 300);
    }
  }, [saveActiveElement]);

  // Remove an item from an array - rewritten to avoid race conditions
  const removeItem = useCallback((path: string[], index: number) => {
    // Create a unique key for this operation
    const operationKey = `${path.join('.')}-${index}`;
    const now = Date.now();
    
    // Check if this operation was executed recently (within 1 second)
    if ((lastOperationTimestamps.current[operationKey] || 0) > now - 1000) {
      console.log(`Skipping duplicate remove for ${operationKey} - too soon since last operation`);
      return;
    }
    
    // Record this operation timestamp
    lastOperationTimestamps.current[operationKey] = now;
    
    // Save active element for focus restoration
    saveActiveElement();
    
    setFormData(prevData => {
      try {
        // Create deep copy to avoid mutation issues
        const newData = JSON.parse(JSON.stringify(prevData));
        
        // Navigate to the array
        let current = newData;
        for (let i = 0; i < path.length; i++) {
          const key = path[i];
          if (current[key] === undefined) {
            console.error(`Path ${path.join('.')} not found at ${key}`);
            return prevData; // Return unchanged data if path doesn't exist
          }
          current = current[key];
        }
        
        // Ensure we're working with an array
        if (!Array.isArray(current)) {
          console.error(`Target at path ${path.join('.')} is not an array`);
          return prevData;
        }
        
        // Get the ID of the item before removing (for accordion state cleanup)
        const itemId = current[index]?.id;
        
        // Remove the item
        current.splice(index, 1);
        
        // Remove from expanded accordions if needed
        if (itemId) {
          setTimeout(() => {
            setExpandedAccordions(prev => {
              const updated = { ...prev };
              delete updated[itemId];
              return updated;
            });
          }, 0);
        }
        
        return newData;
      } catch (error) {
        console.error('Error in remove operation:', error);
        return prevData; // Return unchanged data on error
      }
    });
  }, [saveActiveElement]);

  // Add a new exclusion year - rewritten with throttling
  const addExclusionYear = useCallback(() => {
    if (!newExclusionYear.trim() || isNaN(parseInt(newExclusionYear))) return;
    
    const operationKey = `add-exclusion-year-${currentExclusionYears.path.join('.')}`;
    const now = Date.now();
    
    if ((lastOperationTimestamps.current[operationKey] || 0) > now - 1000) {
      return; // Prevent duplicate operations
    }
    
    lastOperationTimestamps.current[operationKey] = now;
    
    const year = parseInt(newExclusionYear);
    const newYears = [...currentExclusionYears.years, year];
    
    handleChange(currentExclusionYears.path, newYears);
    setCurrentExclusionYears({ ...currentExclusionYears, years: newYears });
    setNewExclusionYear('');
  }, [newExclusionYear, currentExclusionYears, handleChange]);

  // Remove an exclusion year - rewritten with throttling
  const removeExclusionYear = useCallback((index: number) => {
    const operationKey = `remove-exclusion-year-${index}-${currentExclusionYears.path.join('.')}`;
    const now = Date.now();
    
    if ((lastOperationTimestamps.current[operationKey] || 0) > now - 1000) {
      return; // Prevent duplicate operations
    }
    
    lastOperationTimestamps.current[operationKey] = now;
    
    const newYears = [...currentExclusionYears.years];
    newYears.splice(index, 1);
    
    handleChange(currentExclusionYears.path, newYears);
    setCurrentExclusionYears({ ...currentExclusionYears, years: newYears });
  }, [currentExclusionYears, handleChange]);

  // Open the exclusion years dialog
  const openExclusionYearsDialog = useCallback((years: number[], path: string[], event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Throttle to prevent double-opens
    const operationKey = `open-exclusion-dialog-${path.join('.')}`;
    const now = Date.now();
    
    if ((lastOperationTimestamps.current[operationKey] || 0) > now - 1000) {
      return; // Prevent duplicate operations
    }
    
    lastOperationTimestamps.current[operationKey] = now;
    
    setCurrentExclusionYears({ years, path });
    setExclusionYearDialogOpen(true);
  }, []);

  // Templates for adding new items - with empty values and proper ID templates
  const getNewCadreTemplate = useCallback((): Cadre => ({
    id: `cadre-001`,  // Three-digit format starting ID
    name: "",  // Empty string
    startBatchYear: new Date().getFullYear() - 5,
    endBatchYear: new Date().getFullYear(),
    exculsionYearList: []
  }), []);

  const getNewServiceTemplate = useCallback((): Service => ({
    id: `cs-001`,  // Changed to use cs- prefix with three-digit format
    name: "", // Empty string
    displayName: "", // Empty string
    cadreControllingAuthority: "", // Empty string
    commonBatchStartYear: new Date().getFullYear() - 5,
    commonBatchEndYear: new Date().getFullYear(),
    commonBatchExclusionYearList: [],
    cadreList: [] // Empty array - no default cadres
  }), []);

  const getNewCivilServiceTypeTemplate = useCallback((): CivilServiceType => ({
    name: "", // Empty string
    displayName: "", // Empty string
    id: `cst-001`,  // Three-digit format starting ID
    serviceList: [] // Empty array - no default services
  }), []);

  // Render exclusion years as chips
  const renderExclusionYears = useCallback((years: number[], path: string[]) => (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">Exclusion Years:</Typography>
        <Button 
          size="small" 
          onClick={(e) => openExclusionYearsDialog(years, path, e)}
        >
          Edit
        </Button>
      </Stack>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {years.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No exclusion years</Typography>
        ) : (
          years.map((year, idx) => (
            <Chip key={idx} label={year} size="small" />
          ))
        )}
      </Box>
    </Box>
  ), [openExclusionYearsDialog]);

  // Create the debounced handler factories to reliably prevent double execution
  const createDebouncedAddHandler = useCallback((path: string[], template: any) => {
    return debounce((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem(path, template);
    }, 300);
  }, [addItem]);

  // Create the debounced handler factories for remove operations
  const createDebouncedRemoveHandler = useCallback((path: string[], index: number) => {
    return debounce((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      removeItem(path, index);
    }, 300);
  }, [removeItem]);

  // Render a cadre
  const renderCadre = useCallback((cadre: Cadre, index: number, parentPath: string[]) => {
    const basePath = [...parentPath, index.toString()];
    const accordionId = cadre.id;
    const positionKey = `cadre-${index}-${parentPath.join('-')}`;
    
    // Check expanded state using both ID and position keys
    const isExpanded = !!expandedAccordions[accordionId] || !!expandedAccordions[positionKey]; 
    
    // Create a debounced remove handler specifically for this item
    const handleRemoveCadre = createDebouncedRemoveHandler(parentPath, index);
    
    return (
      <Accordion 
        expanded={isExpanded}
        onChange={handleAccordionChange(accordionId, index, 'cadre')}
        key={positionKey} // Use position-based key instead of ID
        sx={{ 
          mb: 2,
          ...styles.cadre,
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${accordionId}-content`}
          id={`panel-${accordionId}-header`}
          sx={{
            '&.Mui-expanded': {
              minHeight: '48px', // Fix height issues when expanded
            }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
            <Typography variant="h6" sx={{ color: '#e65100' }}>
              Cadre: {cadre.name || "Unnamed Cadre"}
            </Typography>
            <Button 
              color="error" 
              onClick={handleRemoveCadre}
              size="small"
            >
              Remove
            </Button>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ID"
                fullWidth
                value={cadre.id || ''}
                onChange={(e) => handleChange([...basePath, "id"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "id"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                fullWidth
                value={cadre.name || ''}
                onChange={(e) => handleChange([...basePath, "name"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "name"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Batch Year"
                fullWidth
                type="number"
                value={cadre.startBatchYear || ''}
                onChange={(e) => handleChange([...basePath, "startBatchYear"], parseInt(e.target.value) || 0)}
                inputProps={{ 'data-path': [...basePath, "startBatchYear"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Batch Year"
                fullWidth
                type="number"
                value={cadre.endBatchYear || ''}
                onChange={(e) => handleChange([...basePath, "endBatchYear"], parseInt(e.target.value) || 0)}
                inputProps={{ 'data-path': [...basePath, "endBatchYear"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              {renderExclusionYears(cadre.exculsionYearList || [], [...basePath, "exculsionYearList"])}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  }, [expandedAccordions, handleAccordionChange, handleChange, renderExclusionYears, createDebouncedRemoveHandler]);

  // Render a service
  const renderService = useCallback((service: Service, index: number, parentPath: string[]) => {
    const basePath = [...parentPath, index.toString()];
    const cadreListPath = [...basePath, "cadreList"];
    const accordionId = service.id;
    const positionKey = `service-${index}-${parentPath.join('-')}`;
    
    // Check expanded state using both ID and position keys
    const isExpanded = !!expandedAccordions[accordionId] || !!expandedAccordions[positionKey];
    
    // Create debounced handlers for this service with properly formatted template
    const handleAddCadre = createDebouncedAddHandler(cadreListPath, getNewCadreTemplate());
    const handleRemoveService = createDebouncedRemoveHandler(parentPath, index);
    
    return (
      <Accordion 
        expanded={isExpanded}
        onChange={handleAccordionChange(accordionId, index, 'service')}
        key={positionKey} // Use position-based key instead of ID
        sx={{ 
          mb: 3,
          ...styles.service,
          '&.Mui-expanded': {
            margin: '0 0 24px 0', 
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${accordionId}-content`}
          id={`panel-${accordionId}-header`}
          sx={{
            '&.Mui-expanded': {
              minHeight: '48px',
            }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
            <Typography variant="h5" sx={{ color: '#2e7d32' }}>
              {service.displayName || "Unnamed Service"}
            </Typography>
            <Button 
              color="error" 
              onClick={handleRemoveService}
              size="small"
            >
              Remove
            </Button>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ID"
                fullWidth
                value={service.id || ''}
                onChange={(e) => handleChange([...basePath, "id"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "id"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                fullWidth
                value={service.name || ''}
                onChange={(e) => handleChange([...basePath, "name"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "name"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Display Name"
                fullWidth
                value={service.displayName || ''}
                onChange={(e) => handleChange([...basePath, "displayName"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "displayName"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cadre Controlling Authority"
                fullWidth
                value={service.cadreControllingAuthority || ''}
                onChange={(e) => handleChange([...basePath, "cadreControllingAuthority"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "cadreControllingAuthority"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Common Batch Start Year"
                fullWidth
                type="number"
                value={service.commonBatchStartYear || ''}
                onChange={(e) => handleChange([...basePath, "commonBatchStartYear"], parseInt(e.target.value) || 0)}
                inputProps={{ 'data-path': [...basePath, "commonBatchStartYear"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Common Batch End Year"
                fullWidth
                type="number"
                value={service.commonBatchEndYear || ''}
                onChange={(e) => handleChange([...basePath, "commonBatchEndYear"], parseInt(e.target.value) || 0)}
                inputProps={{ 'data-path': [...basePath, "commonBatchEndYear"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              {renderExclusionYears(
                service.commonBatchExclusionYearList || [], 
                [...basePath, "commonBatchExclusionYearList"]
              )}
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Cadres</Typography>
              <Button 
                onClick={handleAddCadre}
                variant="outlined"
                size="small"
                color="warning"
                data-testid={`add-cadre-${index}`}
              >
                Add Cadre
              </Button>
            </Stack>
            
            {service.cadreList?.map((cadre, idx) => 
              renderCadre(cadre, idx, cadreListPath)
            ) || null}
            
            {(!service.cadreList || service.cadreList.length === 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                No cadres added yet. Click 'Add Cadre' to create one.
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  }, [
    expandedAccordions, 
    handleAccordionChange, 
    handleChange, 
    renderExclusionYears, 
    createDebouncedAddHandler, 
    createDebouncedRemoveHandler, 
    getNewCadreTemplate, 
    renderCadre
  ]);

  // Render a civil service type
  const renderCivilServiceType = useCallback((cst: CivilServiceType, index: number) => {
    const basePath = ["civilServiceType", "civilServiceTypeList", index.toString()];
    const serviceListPath = [...basePath, "serviceList"];
    const accordionId = cst.id;
    const positionKey = `cst-${index}`;
    
    // Check expanded state using both ID and position keys
    const isExpanded = !!expandedAccordions[accordionId] || !!expandedAccordions[positionKey];
    
    // Create debounced handlers for this civil service type with properly formatted template
    const handleAddService = createDebouncedAddHandler(serviceListPath, getNewServiceTemplate());
    const handleRemoveCivilServiceType = createDebouncedRemoveHandler(["civilServiceType", "civilServiceTypeList"], index);
    
    return (
      <Accordion 
        expanded={isExpanded}
        onChange={handleAccordionChange(accordionId, index, 'cst')}
        key={positionKey} // Use position-based key instead of ID
        sx={{ 
          mb: 4, 
          ...styles.civilServiceType,
          '&.Mui-expanded': {
            margin: '0 0 32px 0', 
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${accordionId}-content`}
          id={`panel-${accordionId}-header`}
          sx={{
            '&.Mui-expanded': {
              minHeight: '48px',
            }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
            <Typography variant="h4" sx={{ color: '#3f51b5' }}>
              {cst.displayName || "Unnamed Civil Service Type"}
            </Typography>
            <Button 
              color="error" 
              onClick={handleRemoveCivilServiceType}
              size="small"
            >
              Remove
            </Button>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="ID"
                fullWidth
                value={cst.id || ''}
                onChange={(e) => handleChange([...basePath, "id"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "id"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Name"
                fullWidth
                value={cst.name || ''}
                onChange={(e) => handleChange([...basePath, "name"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "name"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Display Name"
                fullWidth
                value={cst.displayName || ''}
                onChange={(e) => handleChange([...basePath, "displayName"], e.target.value)}
                inputProps={{ 'data-path': [...basePath, "displayName"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">Services</Typography>
              <Button 
                onClick={handleAddService}
                variant="outlined"
                color="success"
                data-testid={`add-service-${index}`}
              >
                Add Service
              </Button>
            </Stack>
            
            {cst.serviceList?.map((service, idx) => 
              renderService(service, idx, serviceListPath)
            ) || null}
            
            {(!cst.serviceList || cst.serviceList.length === 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ my: 4, textAlign: 'center' }}>
                No services added yet. Click 'Add Service' to create one.
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  }, [
    expandedAccordions, 
    handleAccordionChange, 
    handleChange, 
    createDebouncedAddHandler, 
    createDebouncedRemoveHandler, 
    getNewServiceTemplate, 
    renderService
  ]);

  // Create debounced handler for adding civil service type with properly formatted template
  const handleAddCivilServiceType = useCallback(() => {
    addItem(["civilServiceType", "civilServiceTypeList"], getNewCivilServiceTypeTemplate());
  }, [addItem, getNewCivilServiceTypeTemplate]);

  // Create a debounced version of the add function for the main button
  const debouncedAddCivilServiceType = useCallback(
    debounce(handleAddCivilServiceType, 500),
    [handleAddCivilServiceType]
  );

  // Handle form submission with API call
  const handleSubmit = useCallback(async () => {
    // Ensure we don't have a race condition
    const operationKey = 'submit-form';
    const now = Date.now();
    
    if ((lastOperationTimestamps.current[operationKey] || 0) > now - 2000) {
      return; // Prevent duplicate submission within 2 seconds
    }
    
    lastOperationTimestamps.current[operationKey] = now;
    
    try {
      const output = JSON.stringify(formData, null, 2);
      setJsonOutput(output);
  
      // Save to API if we have an ID
      if (id && configData) {
        try {
          setIsLoading(true);
          
          // Create payload for API update
          const updatePayload = {
            ...configData,
            value: JSON.stringify(formData),
          };
          const request: any = {
            request: updatePayload
          };
          
          const response = await systemSettingsService.updateConfig(request);
          if (response && response.responseCode === "OK") {
            console.log("Configuration updated successfully");
            setSuccessMessage("Configuration updated successfully");
            
            // Wait a moment for the user to see the success message
            setTimeout(() => {
              // Navigate back to system settings list
              navigate('/system-settings');
            }, 1500);
          } else {
            console.error("Failed to update configuration:", response);
            setError(response?.responseMessage || "Failed to update configuration");
          }
        } catch (err) {
          console.error("Error updating configuration:", err);
          setError("Error saving configuration data");
        } finally {
          setIsLoading(false);
        }
      }
      
      // Show the output dialog
      setDialogOpen(true);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  }, [formData, id, configData]);

  // Create a debounced version of the submit handler
  const debouncedSubmit = useCallback(
    debounce(handleSubmit, 500),
    [handleSubmit]
  );

  const handleKeyPressOnExclusionYear = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExclusionYear();
    }
  }, [addExclusionYear]);

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {id ? "Loading configuration data..." : "Saving configuration..."}
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3, border: '1px solid #f44336', borderRadius: 1, bgcolor: '#ffebee', mb: 4 }}>
        <Typography variant="h6" color="error">Error: {error}</Typography>
        {id && (
          <Button variant="contained" onClick={getConfigData} sx={{ mt: 2 }}>
            Retry Loading Configuration
          </Button>
        )}
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mb: 5 }}>
        {/* Config ID display if available */}
        {id && configData && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle1">
              Editing Configuration ID: <strong>{id}</strong>
            </Typography>
            {configData.key && (
              <Typography variant="subtitle2">
                Key: {configData.key}
              </Typography>
            )}
          </Box>
        )}
        
        {/* Main form fields */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            {formData.civilServiceType.displayName || 'Civil Service Type'}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                fullWidth
                value={formData.civilServiceType.name || ''}
                onChange={(e) => handleChange(["civilServiceType", "name"], e.target.value)}
                inputProps={{ 'data-path': ["civilServiceType", "name"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Display Name"
                fullWidth
                value={formData.civilServiceType.displayName || ''}
                onChange={(e) => handleChange(["civilServiceType", "displayName"], e.target.value)}
                inputProps={{ 'data-path': ["civilServiceType", "displayName"].join('.') }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">Civil Service Types</Typography>
              <Button 
                onClick={debouncedAddCivilServiceType}
                variant="contained"
                color="primary"
                data-testid="add-civil-service-type"
              >
                Add Civil Service Type
              </Button>
            </Stack>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Render all civil service types */}
        {formData.civilServiceType.civilServiceTypeList?.map((cst, index) => 
          renderCivilServiceType(cst, index)
        ) || null}
        
        {(!formData.civilServiceType.civilServiceTypeList || formData.civilServiceType.civilServiceTypeList.length === 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ my: 4, textAlign: 'center' }}>
            No civil service types added yet. Click 'Add Civil Service Type' to create one.
          </Typography>
        )}
        
        {/* Submit button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={debouncedSubmit}
            disabled={isLoading}
          >
            {id ? "Save Configuration" : "Submit Form"}
          </Button>
        </Box>
        
        {/* JSON Output Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Form Submission Output</DialogTitle>
          <DialogContent>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                backgroundColor: '#f5f5f5', 
                maxHeight: '60vh', 
                overflow: 'auto',
                fontFamily: 'monospace'
              }}
            >
              <pre>{jsonOutput}</pre>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* Exclusion Years Dialog */}
        <Dialog 
          open={exclusionYearDialogOpen} 
          onClose={() => setExclusionYearDialogOpen(false)}
        >
          <DialogTitle>Edit Exclusion Years</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Current exclusion years:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {currentExclusionYears.years.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No exclusion years</Typography>
                ) : (
                  currentExclusionYears.years.map((year, idx) => (
                    <Chip 
                      key={idx} 
                      label={year} 
                      onDelete={() => removeExclusionYear(idx)} 
                    />
                  ))
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', mt: 2 }}>
              <TextField
                label="Add Exclusion Year"
                type="number"
                value={newExclusionYear}
                onChange={(e) => setNewExclusionYear(e.target.value)}
                onKeyPress={handleKeyPressOnExclusionYear}
                size="small"
                fullWidth
                inputProps={{ 'data-path': 'exclusion-year-input' }}
                InputLabelProps={{ shrink: true }}
              />
              <Button 
                onClick={addExclusionYear}
                sx={{ ml: 1 }}
                variant="contained"
              >
                Add
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExclusionYearDialogOpen(false)}>Done</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};