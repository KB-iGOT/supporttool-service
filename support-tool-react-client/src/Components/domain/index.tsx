import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Paper,
  LinearProgress,
  IconButton,
  Button,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
  AlertColor,
  TextField,
  InputAdornment,
  FormHelperText
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { FormData as CustomFormData } from "../../types/forms";
import { domainService } from "../../services/domain.service";

interface Domain {
  id: string;
  contextType: string;
  contextName: string;
}

export const Domain = () => {
  const [allDomains, setAllDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as AlertColor,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  
  // New state for the domain form
  const [domainInput, setDomainInput] = useState("");
  const [domainInputError, setDomainInputError] = useState("");

  // Domain validation pattern for domain names like yahoo.co.in, gmail.com
  const domainNamePattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  // Filter domains based on search query
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return allDomains;
    
    return allDomains.filter(domain => 
      domain.contextName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allDomains, searchQuery]);

  // Calculate total count
  const totalCount = filteredDomains.length;

  // Calculate paginated domains
  const paginatedDomains = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredDomains.slice(startIndex, endIndex);
  }, [filteredDomains, page, rowsPerPage]);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const response = await domainService.fetchDomains();
      if (response && response.data) {
        setAllDomains(response.data);
      } else {
        setAllDomains([]);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
      setSnackbar({
        open: true,
        message: "Failed to load domains",
        severity: "error",
      });
      setAllDomains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []); // Only fetch on initial mount

  // Reset page when search query changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleDeleteClick = (domain: Domain) => {
    setDomainToDelete(domain);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!domainToDelete) return;
    
    setLoading(true);
    try {
      const response = await domainService.deleteDomain(domainToDelete.contextName);
      setSnackbar({
        open: true,
        message: `Domain '${domainToDelete.contextName}' deleted successfully`,
        severity: "success",
      });
      
      // Refresh the data
      fetchDomains();
    } catch (error) {
      console.error("Error deleting domain:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete domain",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setOpenDialog(false);
      setDomainToDelete(null);
    }
  };

  // Handle domain input change
  const handleDomainInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDomainInput(value);
    
    // Validate domain as user types
    if (!value) {
      setDomainInputError("Domain name is required");
    } else if (!domainNamePattern.test(value)) {
      setDomainInputError("Please enter a valid domain name (e.g., yahoo.com, gmail.com)");
    } else {
      setDomainInputError("");
    }
  };

  // Handle add domain submission
  const handleAddDomainSubmit = async () => {
    // Validate domain before submitting
    if (!domainInput) {
      setDomainInputError("Domain name is required");
      return;
    }
    
    if (!domainNamePattern.test(domainInput)) {
      setDomainInputError("Please enter a valid domain name (e.g., yahoo.com, gmail.com)");
      return;
    }
    
    setLoading(true);
    try {
      const formData = { contextName: domainInput };
      const requestPayload = { request: formData };

      const response = await domainService.addDomain(requestPayload);
      if(response) {
        console.log("Domain added successfully:", response);
      }
      
      setSnackbar({
        open: true,
        message: `Domain '${domainInput}' added successfully`,
        severity: "success",
      });
      
      // Refresh the data and return to first page
      setPage(0);
      fetchDomains();
      
      // Close dialog and reset form
      setOpenAddDialog(false);
      setDomainInput("");
      setDomainInputError("");
    } catch (error: any) {
      console.error("Error adding domain:", error);
      
      // Check for conflict status (409) which indicates duplicate domain
      if (error.response && error.response.status === 409) {
        setDomainInputError(`Domain '${domainInput}' already exists`);
        setSnackbar({
          open: true,
          message: `Domain '${domainInput}' already exists`,
          severity: "error",
        });
      } else {
        // Generic error message for other errors
        setSnackbar({
          open: true,
          message: error.response?.data?.message || "Failed to add domain",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
    setDomainInput("");
    setDomainInputError("");
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setDomainInput("");
    setDomainInputError("");
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Domains</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Domain
        </Button>
      </Box>
      
      {/* Search field */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by context name..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {loading && <LinearProgress />}
        
        <TableContainer sx={{ maxHeight: "calc(100vh - 280px)" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Context Type</TableCell>
                <TableCell>Context Name</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDomains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell>{domain.contextType}</TableCell>
                  <TableCell>{domain.contextName}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(domain)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedDomains.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    {searchQuery.trim() 
                      ? `No domains found matching "${searchQuery}"` 
                      : "No domains found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Confirmation Dialog for Delete */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the domain "{domainToDelete?.contextName}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Add Domain Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Domain</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Domain Name"
              placeholder="Enter domain name (e.g., yahoo.com, gmail.com)"
              value={domainInput}
              onChange={handleDomainInputChange}
              error={!!domainInputError}
              helperText={domainInputError}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button 
            onClick={handleAddDomainSubmit} 
            variant="contained"
            disabled={!domainInput || !!domainInputError || loading}
          >
            Add Domain
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};