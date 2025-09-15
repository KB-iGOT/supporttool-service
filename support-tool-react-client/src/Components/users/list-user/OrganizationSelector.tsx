import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { 
  Autocomplete, 
  Box,
  CircularProgress, 
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField, 
  InputAdornment 
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import { Organization } from "./types";
import { organisationService } from "../../../services/organisations.service";

interface OrganizationSelectorProps {
  selectedOrg: Organization | null;
  onOrgSelect: (org: Organization | null) => void;
  onBlur?: () => void;
  error?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  selectedOrg,
  onOrgSelect,
  onBlur,
  error = false
}) => {
  // State
  const [orgSearchType, setOrgSearchType] = useState<'name' | 'orgId'>('name');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [orgOffset, setOrgOffset] = useState(0);
  const [orgLoading, setOrgLoading] = useState(false);
  const [hasMoreOrgs, setHasMoreOrgs] = useState(true);
  const orgLimit = 10;

  // Refs
  const orgListRef = useRef<HTMLUListElement>(null);

  // Fetch organizations with pagination and search
  const fetchOrganizations = useCallback(async (offset = 0, query = "", searchType: 'name' | 'orgId', reset = false) => {
    try {
      setOrgLoading(true);
      const request = {
        request: {
          filters: searchType === 'orgId' && query ? { identifier: [query] } : {
          status: 1},
          fields: ["identifier", "channel"],
          sortBy: { createdDate: "Desc" },
          limit: orgLimit,
          offset: offset,
          query: searchType === 'name' ? query : ""
        }
      };

      // If searching by Org ID, don't send an empty filter
      if (searchType === 'orgId' && !query) {
        setOrganizations([]);
        setHasMoreOrgs(false);
        setOrgLoading(false);
        return;
      }

      const response = await organisationService.fetchOrganisationsData(request);
        
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
    } finally {
      setOrgLoading(false);
    }
  }, [orgLimit]);

  // Handle organization search change
  const handleOrgSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOrgSearchQuery(value);
    
    // Reset organization list and fetch with new search query
    setOrgOffset(0);
    setHasMoreOrgs(true);
    fetchOrganizations(0, value, orgSearchType, true);
  };

  // Handle organization selection
  const handleOrgSelect = (_event: React.SyntheticEvent, value: Organization | null) => {
    onOrgSelect(value);
  };

  // Infinite scroll handler for organization dropdown
  const handleOrgScroll = useCallback(() => {
    if (orgListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = orgListRef.current;
      
      // When user has scrolled to the bottom
      if (scrollHeight - scrollTop <= clientHeight + 50 && !orgLoading && hasMoreOrgs) {
        fetchOrganizations(orgOffset, orgSearchQuery, orgSearchType);
      }
    }
  }, [orgOffset, orgLoading, hasMoreOrgs, orgSearchQuery, fetchOrganizations, orgSearchType]);

  // Initial load of organizations
  useEffect(() => {
    fetchOrganizations(0, "", 'name', true);
  }, [fetchOrganizations]);
  
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

  // Reset search when type changes
  const handleSearchTypeChange = (event: any) => {
    const newType = event.target.value as 'name' | 'orgId';
    setOrgSearchType(newType);
    setOrgSearchQuery("");
    setOrganizations([]);
    setOrgOffset(0);
    setHasMoreOrgs(true);
    // Trigger a fetch for all orgs if switching back to 'name'
    if (newType === 'name') {
      fetchOrganizations(0, "", 'name', true);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <FormControl sx={{ minWidth: 150, mt: 0 }}>
        <InputLabel id="org-search-type-label">Search Org By</InputLabel>
        <Select
          labelId="org-search-type-label"
          value={orgSearchType}
          label="Search Org By"
          onChange={handleSearchTypeChange}
          size="medium"
          sx={{ height: '56px' }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="orgId">Org ID</MenuItem>
        </Select>
      </FormControl>
      <Autocomplete
        id="organization-select"
        options={organizations}
        getOptionLabel={(option) => option.channel}
        value={selectedOrg}
        onChange={handleOrgSelect}
        onBlur={onBlur}
        sx={{ mt: 0, flexGrow: 1 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Organization"
            placeholder={orgSearchType === 'name' ? 'Search by name...' : 'Enter exact Org ID...'}
            onChange={handleOrgSearchChange}
            required={true}
            error={error}
            helperText={error ? 'Organization is required' : ' '}
            FormHelperTextProps={{ sx: { mt: 0, minHeight: '1.25em' } }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon />
                </InputAdornment>
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
          <li {...props} key={option.identifier}>{option.channel} - {option?.identifier}</li>
        )}
        ListboxProps={{ ref: orgListRef, style: { maxHeight: 200, overflow: 'auto' } }}
        filterOptions={(x) => x}
        loading={orgLoading}
        loadingText="Loading organizations..."
        noOptionsText="No organizations found"
        fullWidth
      />
    </Box>
  );
};