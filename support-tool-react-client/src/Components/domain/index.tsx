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
  InputAdornment
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { DynamicFormDialog } from "../common-components/dynamic-form-dialog/DynamicFormDialog";
import { FieldDefinition, FormData as CustomFormData } from "../../types/forms";
import axios from "axios";
import env from "../../Config/env";
import { domainService } from "../../services/domain.service";
import { request } from "http";

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
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);

  const formFields: any[] = [
    // {
    //   name: "contextType",
    //   displayName: "Context Type",
    //   fieldType: "text",
    //   optional: true,
    //   placeholder: "Enter context type",
    //   identifier: 'contextType',
    // },
    {
      name: "contextName",
      displayName: "Context Name",
      fieldType: "text",
      optional: true,
      placeholder: "Enter context name",
      identifier: 'contextName',
    }
  ];

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

  const handleAddDomain = async (formData: CustomFormData) => {
    
    setLoading(true);
    try {
        let requestPayload = {
            request: formData
        }

      const response = await domainService.addDomain(requestPayload);
      if(response) {
        console.log("Domain added successfully:", response);
      }
      
      setSnackbar({
        open: true,
        message: "Domain added successfully",
        severity: "success",
      });
      
      // Refresh the data and return to first page
      setPage(0);
      fetchDomains();
      return true; // Indicate success to close the dialog
    } catch (error) {
      console.error("Error adding domain:", error);
      setSnackbar({
        open: true,
        message: "Failed to add domain",
        severity: "error",
      });
      return false; // Indicate failure to keep dialog open
    } finally {
      setLoading(false);
    }
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
          onClick={() => setOpenFormDialog(true)}
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

      {/* Dynamic Form Dialog for Adding Domain */}
      <DynamicFormDialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        title="Add New Domain"
        fields={formFields}
        initialData={{}}
        onSubmit={handleAddDomain}
        submitButtonText="Add Domain"
      />

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