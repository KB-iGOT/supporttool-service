import * as React from "react";
import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import {
  Autocomplete,
  CircularProgress,
  TextField,
  InputAdornment
} from "@mui/material";

interface Designation {
  name: string;
  identifier: string;
}

interface DesignationSelectorProps {
  frameworkId: string | undefined;
  selectedDesignation: Designation | null;
  onDesignationSelect: (designation: Designation | null) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
}

export const DesignationSelector: React.FC<DesignationSelectorProps> = ({
  frameworkId,
  selectedDesignation,
  onDesignationSelect,
  onBlur,
  error = false,
  disabled = false
}) => {
  // State
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;
  const [WorkIcon, setWorkIcon] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@mui/icons-material/Work').then(module => {
      setWorkIcon(() => module.default);
    });
  }, []);

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
      const response = await designationService.searchOrgDesignations(query, frameworkId, limit, currentOffset);

      const newDesignations = response.result?.Term || [];

      if (reset) {
        setDesignations(newDesignations);
      } else {
        setDesignations(prev => [...prev, ...newDesignations]);
      }

      setHasMore(newDesignations.length === limit);
      setOffset(currentOffset + newDesignations.length);

    } catch (error) {
      console.error("Error fetching designations:", error);
    } finally {
      setLoading(false);
    }
  }, [frameworkId, limit]);

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
    setHasMore(true);
    fetchDesignations(0, "", true);
  }, [fetchDesignations, frameworkId]);

  return (
    <Autocomplete
      id="designation-select"
      options={designations}
      getOptionLabel={(option) => option.name}
      value={selectedDesignation}
      onChange={(_event, value) => onDesignationSelect(value)}
      onBlur={onBlur}
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