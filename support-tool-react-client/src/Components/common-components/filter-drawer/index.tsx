import React from 'react';
import {
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Box,
  Typography,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { Facets } from '../../../types/contents';



interface FilterConfig {
  [key: string]: 'single' | 'multi';
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  facets: Facets[];
  filterConfig: FilterConfig;
  onFilterChange: (filters: { [key: string]: string[] }) => void;
  initialFilters?: { [key: string]: string[] };
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  facets = [],  // Provide default empty array
  filterConfig,
  onFilterChange,
  initialFilters = {}, // Default to empty object
}) => {
  const [tempFilters, setTempFilters] = React.useState<{ [key: string]: string[] }>(initialFilters);

  // Update tempFilters when drawer opens or initialFilters change
  React.useEffect(() => {
    if (open || Object.keys(initialFilters).length > 0) {
      setTempFilters({...initialFilters});
    }
  }, [open, initialFilters]);

  const handleFilterChange = (facetName: string, value: string[]) => {
    setTempFilters({
      ...tempFilters,
      [facetName]: value,
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const emptyFilters = {};
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 320, p: 3, display: 'flex', flexDirection: 'column' },
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Filters
        </Typography>
        
        {/* Show message if no facets are available */}
        {(!facets || facets.length === 0) ? (
          <Typography color="text.secondary">
            No filters available
          </Typography>
        ) : (
          facets.map((facet) => (
            <FormControl key={facet.name} fullWidth sx={{ mb: 2 }}>
              <InputLabel id={`${facet.name}-label`}>
                {facet.name.charAt(0).toUpperCase() + facet.name.slice(1)}
              </InputLabel>
              <Select
                labelId={`${facet.name}-label`}
                multiple={filterConfig[facet.name] === 'multi'}
                value={tempFilters[facet.name] || []}
                onChange={(event: SelectChangeEvent<string[]>) => {
                  const value = event.target.value;
                  handleFilterChange(
                    facet.name,
                    typeof value === 'string' ? value.split(',') : value
                  );
                }}
                input={<OutlinedInput label={facet.name} />}
                renderValue={(selected) => {
                  if (Array.isArray(selected)) {
                    return selected.join(', ');
                  }
                  return selected as string;
                }}
              >
                {Array.isArray(facet.values) && facet.values.map((value) => (
                  <MenuItem key={value.name} value={value.name}>
                    {filterConfig[facet.name] === 'multi' && (
                      <Checkbox
                        checked={
                          Array.isArray(tempFilters[facet.name]) && 
                          tempFilters[facet.name]?.indexOf(value.name) > -1
                        }
                      />
                    )}
                    <ListItemText
                      primary={`${value.name} (${value.count})`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))
        )}
      </Box>

      <Box sx={{ mt: 3, pt: 2, mb:4 }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearAllIcon />}
            onClick={handleClearFilters}
            fullWidth
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FilterAltIcon />}
            onClick={handleApplyFilters}
            fullWidth
          >
            Apply
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};