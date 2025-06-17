
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from '@mui/material/TablePagination';
import Paper from "@mui/material/Paper";
import { useEffect, useState, useMemo } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import PencilIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Alert, { AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { Button, FormControl, TextField, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { organisationService } from "../../services/organisations.service";
import { Outlet, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";

interface IOrg {
  id: string;
  orgName: string;
  channel: string;
  slug: string;
}

export const OrganisationList = () => {
  // Store all settings data from API
  const navigate = useNavigate();
  const [orgsList, setOrgsList] = useState<IOrg[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchQuery, setSearchQuery] = useState("");
  
  // Use memoized filtered data based on search query
  const filteredSettings = useMemo(() => {
    if (!searchQuery.trim()) {
      return orgsList;
    }
    
    const query = searchQuery.toLowerCase();
    return orgsList.filter(setting => 
      setting.orgName.toLowerCase().includes(query) || 
      setting.id.toLowerCase().includes(query) ||
      (setting.channel.toLowerCase().includes(query) || 
      setting.slug.toLowerCase().includes(query))
    );
  }, [orgsList, searchQuery]);

  // Current page data (pagination slice of filtered data)
  const currentPageData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredSettings.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSettings, page, rowsPerPage]);

  // Handler for search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when search changes
  };

  const handleToastClose = () =>
    setToasts({ message: "", open: false, severity: undefined });

  const fetchSystemSettings = async () => {
    setLoading(true);
    try {
      const data = await organisationService.fetchOrganisations();
      if (data.result && data.result.response.count > 0) {
        setOrgsList(data.result.response.content);
      }
    } catch (error) {
      console.error("Error fetching organisations:", error);
      setToasts({
        message: "Failed to load organisations",
        open: true,
        severity: "error",
      });
    }
    setLoading(false);
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(0);
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []); // Empty dependency array to run only once on mount

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <div>
                <Typography variant="h4" component="h1" sx={{ margin: 0 }}>Organisations</Typography>
                <Typography variant="body2">List of organisations onboarded in the platform.</Typography>                
            </div>

            <Button
              variant="contained"
              onClick={() => navigate("/system-settings/create")}
              startIcon={<AddIcon />}
            >
              Add new Organisation
            </Button>
          </Box>

          <div className="bg-gray-100 p-4">
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
              <FormControl sx={{ flexGrow: 1 }}>
                <TextField
                  autoComplete="off"
                  margin="dense"
                  id="searchSettings"
                  name="searchSettings"
                  label="Search by ID, field or value"
                  type="text"
                  fullWidth
                  variant="filled"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  color="primary"
                  InputProps={{
                    endAdornment: searchQuery ? (
                      <IconButton
                        aria-label="clear search"
                        onClick={handleClearSearch}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    ) : null,
                  }}
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "4px",
                    '& .MuiFilledInput-root': {
                      backgroundColor: "white",
                      '&:hover': {
                        backgroundColor: "white",
                        opacity: 0.9
                      },
                      '&.Mui-focused': {
                        backgroundColor: "white"
                      }
                    }
                  }}
                />
              </FormControl>
            </Box>
          </div>
          
          {filteredSettings.length > 0 ? (
            <>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="Organisation table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Org Name</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Channel</TableCell>
                      <TableCell>Slug</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentPageData.map((row) => (
                      <TableRow
                        key={row.id}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {row.orgName}
                        </TableCell>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.channel}</TableCell>
                        <TableCell>{row.slug}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label="edit"
                            size="small"
                            onClick={() => navigate(`/system-settings/edit/${row.id}`)}  
                          >
                            <PencilIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Table Pagination Component */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={filteredSettings.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          ) : (
            <Alert severity="info">
              No organisation found matching your search criteria.
            </Alert>
          )}
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            open={toasts.open}
            autoHideDuration={6000}
            onClose={handleToastClose}
          >
            <Alert variant="filled" severity={toasts.severity}>
              {toasts.message}
            </Alert>
          </Snackbar>
          <Outlet />
        </>
      )}
    </>
  );
};