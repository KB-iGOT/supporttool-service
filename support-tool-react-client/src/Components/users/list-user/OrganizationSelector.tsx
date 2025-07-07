import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { 
  Autocomplete, 
  CircularProgress, 
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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [orgOffset, setOrgOffset] = useState(0);
  const [orgLoading, setOrgLoading] = useState(false);
  const [hasMoreOrgs, setHasMoreOrgs] = useState(true);
  const orgLimit = 10;

  // Refs
  const orgListRef = useRef<HTMLUListElement>(null);

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
  }, []);

  // Handle organization search change
  const handleOrgSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOrgSearchQuery(value);
    
    // Reset organization list and fetch with new search query
    setOrgOffset(0);
    setHasMoreOrgs(true);
    fetchOrganizations(0, value, true);
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
        fetchOrganizations(orgOffset, orgSearchQuery);
      }
    }
  }, [orgOffset, orgLoading, hasMoreOrgs, orgSearchQuery, fetchOrganizations]);

  // Initial load of organizations
  useEffect(() => {
    fetchOrganizations(0, "", true);
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

  return (
    <Autocomplete
      id="organization-select"
      options={organizations}
      getOptionLabel={(option) => option.orgName}
      value={selectedOrg}
      onChange={handleOrgSelect}
      onBlur={onBlur}
      sx={{ mt: 0 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Organization"
          placeholder="Select an organization"
          onChange={handleOrgSearchChange}
          required={true}
          error={error}
          helperText={error ? 'Organization is required when searching by name' : ' '}
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
  );
};