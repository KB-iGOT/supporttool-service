import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  TextField,
  InputAdornment
} from "@mui/material";
import { UserProfile } from "../../../types/users";
import { frameworkService } from "../../../services/framework.service";

interface Designation {
  name: string;
  identifier: string;
}

interface DesignationSelectorProps {
  user: UserProfile | null;
  selectedDesignation: Designation | null;
  onDesignationSelect: (designation: Designation | null) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
}

export const DesignationSelector: React.FC<DesignationSelectorProps> = ({
  user,
  selectedDesignation,
  onDesignationSelect,
  onBlur,
  error = false,
  disabled = false
}) => {
  // State
  const [frameworkId, setFrameworkId] = useState<string | undefined>(undefined);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;
  const useMasterListRef = useRef(false); // Ref to store the current value of useMasterList
  const [useMasterList, setUseMasterList] = useState(false); // State to track if we're using the master list
  const [WorkIcon, setWorkIcon] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@mui/icons-material/Work').then(module => {
      setWorkIcon(() => module.default);
    });
  }, []);

  // Fetch frameworkId from rootOrgId
  useEffect(() => {
    const fetchFrameworkId = async () => {
      if (user?.rootOrgId) {
        try {
          const response = await frameworkService.fetchFrameworkData(user.rootOrgId);
          const framework = response.result?.framework;
          setFrameworkId(framework?.identifier);
        } catch (error) {
          console.error("Error fetching framework ID:", error);
          setFrameworkId(undefined);
        }
      }
    };

    fetchFrameworkId();
  }, [user?.rootOrgId]);
  
  // Update the ref whenever useMasterList state changes
  useEffect(() => {
    useMasterListRef.current = useMasterList;
  }, [useMasterList]);

  // Refs
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch designations with pagination and search
  const fetchDesignations = useCallback(async (currentOffset = 0, query = "", reset = false) => {
    if (!frameworkId) {
      setDesignations([]);
      setHasMore(false);
      return;
    }
    try {
      setLoading(true);
      // Dynamically import the service to avoid cycles
      const { designationService } = await import("../../../services/designations.service");
      
      let newDesignations: Designation[] = [];
      let count = 0;
 
      // Determine if we should use the master list for this fetch based on the ref.
      const shouldSearchMasterList = useMasterListRef.current;

      if (shouldSearchMasterList) {
        console.log("Searching directly in master list.");
        const masterResponse = await designationService.searchMasterDesignations(query, limit, currentOffset);
        const masterData = masterResponse.result?.result?.data || [];
        count = masterResponse.result?.result?.totalCount || 0;
        newDesignations = masterData.map((item: any) => ({ name: item.designation, identifier: item.id }));
      } else {
        // Always try the organization-specific (composite) search first for new searches or initial load.
        const orgResponse = await designationService.searchOrgDesignations(query, frameworkId, limit, currentOffset);
        newDesignations = orgResponse.result?.Term || [];
        count = orgResponse.result?.count || 0;
 
        // If the org-specific search (composite) returns no results, try the master designation list.
        if (count === 0) {
          if (query) {
            console.log(`No org-specific designations found for "${query}", trying master list.`);
          } else {
            console.log("No org-specific designations found on initial load, trying master list.");
          }

          // If this was the initial load (no query), set the flag to use the master list for subsequent pagination.
          if (query === "" && currentOffset === 0) {
            setUseMasterList(true); 
          }

          // Now, fetch from the master list using the same query.
          const masterResponse = await designationService.searchMasterDesignations(query, limit, currentOffset);
          const masterData = masterResponse.result?.result?.data || [];
          count = masterResponse.result?.result?.totalCount || 0;
          newDesignations = masterData.map((item: any) => ({ name: item.designation, identifier: item.id }));
        }
      }

      console.log(`Fetched ${newDesignations.length} designations. Total available: ${count}. Using master list for pagination: ${useMasterList}`);

      if (reset) {
        setDesignations(newDesignations);
      } else {
        setDesignations(prev => [...prev, ...newDesignations]);
      }

      setHasMore((currentOffset + newDesignations.length) < count);
      setOffset(currentOffset + newDesignations.length);

    } catch (error) {
      console.error("Error fetching designations:", error);
    } finally {
      setLoading(false);
    }
  }, [frameworkId, limit]); // Removed useMasterList from dependencies

  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    setOffset(0);
    setHasMore(true);
    fetchDesignations(0, value, true);
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50 && !loading && hasMore) {
        fetchDesignations(offset, searchQuery); 
      }
    }
  }, [offset, loading, hasMore, searchQuery, fetchDesignations]);

  // Initial load and when frameworkId changes
  useEffect(() => {
    setDesignations([]);
    setOffset(0);
    setUseMasterList(false);
    setHasMore(true);
    fetchDesignations(0, "", true);
  }, [fetchDesignations, frameworkId]);

  useEffect(() => {
    if (selectedDesignation) {
      setInputValue(selectedDesignation.name);
    }
  }, [selectedDesignation]);

  return (
    <Autocomplete
      id="designation-select"
      options={designations}
      getOptionLabel={(option) => option.name}
      value={selectedDesignation}
      onChange={(_event, value) => onDesignationSelect(value)}
      onBlur={onBlur}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue, reason) => {
        if (reason !== 'reset') {
          setInputValue(newInputValue);
        }
      }}
      disabled={disabled || !frameworkId}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Designation"
          placeholder={!frameworkId ? "Select an organization first" : "Search for a designation..."}
          onChange={handleSearchChange}
          error={error}
          helperText={error ? 'Designation is required' : ' '}
          FormHelperTextProps={{ sx: { mt: 0, minHeight: '1.25em' } }}
          InputProps={{
            ...params.InputProps,
            startAdornment: WorkIcon ? (<InputAdornment position="start"><WorkIcon /></InputAdornment>) : null,
            endAdornment: (<>{loading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>)
          }}
        />
      )}
      renderOption={(props, option) => (<li {...props} key={option.identifier}>{option.name}</li>)}
      ListboxProps={{ ref: listRef, onScroll: handleScroll, style: { maxHeight: 200, overflow: 'auto' } }}
      filterOptions={(x) => x}
      loading={loading}
      loadingText="Loading designations..."
      noOptionsText={!frameworkId ? "Please select an organization" : "No designations found"}
      fullWidth
    />
  );
};