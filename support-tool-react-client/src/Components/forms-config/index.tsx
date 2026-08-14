import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Clear as ClearIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formsConfigService } from "../../services/forms-config.service";
import { useDebounce } from "../../hooks/useDebounce";
import { FormConfigViewDrawer } from "./FormConfigViewDrawer";
import { FormConfigRow } from "./types";
import { normalizeFormsConfigList } from "./utils";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const FormsConfig = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FormConfigRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Local search state
  const [searchText, setSearchText] = useState<string>("");
  const debouncedSearch = useDebounce(searchText, 300);

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

  // Local search across every column of the row.
  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => row.searchIndex.includes(query));
  }, [rows, debouncedSearch]);

  // Any change to the result set puts the user back on the first page.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, rows]);

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

  const handleCopyJson = (row: FormConfigRow) => {
    navigator.clipboard.writeText(JSON.stringify(row.raw, null, 2));
    setSnackbar(`"${row.name}" JSON copied to clipboard`);
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Search by name, type, sub type, portal, version or id..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => setSearchText("")}
                disabled={!searchText}
              >
                Clear
              </Button>
            </Grid>
          </Grid>

          {!loading && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Showing {filteredRows.length} of {rows.length} configurations
            </Typography>
          )}
        </CardContent>
      </Card>

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
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Sub Type</TableCell>
                      <TableCell>Portal</TableCell>
                      <TableCell align="center">Client Version</TableCell>
                      <TableCell align="right">ID</TableCell>
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
                              : "No configurations match your search"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow key={row.rowKey} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {row.name || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.type || "-"}</TableCell>
                          <TableCell>{row.subType || "-"}</TableCell>
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
                          <TableCell align="center">{row.clientVersion || "-"}</TableCell>
                          <TableCell align="right">{row.id || "-"}</TableCell>
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
                            {/* <Tooltip title="Copy row JSON">
                              <IconButton size="small" onClick={() => handleCopyJson(row)}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip> */}
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
