import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Clear as ClearIcon, Search as SearchIcon } from "@mui/icons-material";
import {
  FILTER_COLUMNS,
  FilterColumn,
  FilterOption,
  FormConfigFilters,
  countActiveFilters,
} from "./utils";

interface FormsConfigFiltersProps {
  filters: FormConfigFilters;
  options: Record<FilterColumn, FilterOption[]>;
  onChange: (filters: FormConfigFilters) => void;
  onClear: () => void;
  shown: number;
  total: number;
  loading?: boolean;
}

/**
 * Free text for the name, and a dropdown per column that only ever holds a handful
 * of distinct values — searching for "2" across everything matched far too much.
 */
export const FormsConfigFilters: React.FC<FormsConfigFiltersProps> = ({
  filters,
  options,
  onChange,
  onClear,
  shown,
  total,
  loading,
}) => {
  const activeCount = countActiveFilters(filters);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "2fr 1fr 1fr 1fr 1fr",
            },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="Search by name or ID"
            placeholder="e.g. portal_page_home"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            InputProps={{
              startAdornment: (
                <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
          />

          {FILTER_COLUMNS.map(({ key, label }) => (
            <TextField
              key={key}
              select
              fullWidth
              size="small"
              label={label}
              value={filters[key]}
              onChange={(e) => onChange({ ...filters, [key]: e.target.value })}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {options[key].map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.value} ({option.count})
                </MenuItem>
              ))}
            </TextField>
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onClear}
            disabled={activeCount === 0}
          >
            Clear filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
          {!loading && (
            <Typography variant="body2" color="text.secondary">
              Showing {shown} of {total} configurations
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
