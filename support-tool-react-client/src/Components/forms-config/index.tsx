import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formsConfigService } from "../../services/forms-config.service";
import { useDebounce } from "../../hooks/useDebounce";
import { FormConfigViewDrawer } from "./FormConfigViewDrawer";
import { FormsConfigFilters } from "./FormsConfigFilters";
import { FormConfigRow } from "./types";
import {
  EMPTY_FILTERS,
  FormConfigFilters,
  collectFilterOptions,
  filterFormConfigRows,
  normalizeFormsConfigList,
} from "./utils";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const FormsConfig = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FormConfigRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Local search and per-column filters.
  const [filters, setFilters] = useState<FormConfigFilters>(EMPTY_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 300);

  // Local pagination state
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Row whose config is open in the view drawer.
  const [viewRow, setViewRow] = useState<FormConfigRow | null>(null);
  const [snackbar, setSnackbar] = useState<string>("");

  const fetchFormsConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await formsConfigService.getFormsConfigList();
      setRows(normalizeFormsConfigList(response));
    } catch (err: any) {
      console.error("Error fetching forms config list:", err);
      const message =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error occurred";
      setError(`Failed to load forms config list. ${message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormsConfig();
  }, [fetchFormsConfig]);

  // The debounced search is the one that actually filters, so both the rows and the
  // dropdown counts are derived from the same effective filter set.
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  // Each dropdown counts against the other active filters, so the numbers always
  // describe what selecting that value would actually give you.
  const filterOptions = useMemo(
    () => collectFilterOptions(rows, effectiveFilters),
    [rows, effectiveFilters]
  );

  const filteredRows = useMemo(
    () => filterFormConfigRows(rows, effectiveFilters),
    [rows, effectiveFilters]
  );

  // Any change to the result set puts the user back on the first page.
  useEffect(() => {
    setPage(0);
  }, [effectiveFilters, rows]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage]
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Forms Config</Typography>
          <Typography variant="body2" color="text.secondary">
            All form configurations from the portal, searched and paginated locally
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchFormsConfig}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/forms-config/create")}
          >
            New configuration
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <FormsConfigFilters
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
        shown={filteredRows.length}
        total={rows.length}
        loading={loading}
      />

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="right">ID</TableCell>
                      <TableCell>Portal</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Sub Type</TableCell>
                      <TableCell align="center">Client Version</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            {rows.length === 0
                              ? "No form configurations found"
                              : "No configurations match these filters"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow key={row.rowKey} hover>
                          <TableCell align="right">{row.id || "-"}</TableCell>
                          <TableCell>
                            {row.portal ? (
                              <Chip
                                label={row.portal}
                                size="small"
                                variant="outlined"
                                color={row.portal === "mobile" ? "secondary" : "primary"}
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {row.name || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.type || "-"}</TableCell>
                          <TableCell>{row.subType || "-"}</TableCell>
                          <TableCell align="center">{row.clientVersion || "-"}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="View configuration">
                              <IconButton size="small" onClick={() => setViewRow(row)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit configuration">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/forms-config/edit/${row.id}`)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                component="div"
                count={filteredRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <FormConfigViewDrawer
        open={Boolean(viewRow)}
        id={viewRow ? viewRow.id : null}
        fallbackName={viewRow?.name}
        onClose={() => setViewRow(null)}
        onEdit={(configId) => navigate(`/forms-config/edit/${configId}`)}
      />

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Box>
  );
};
