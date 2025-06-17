import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useEffect, useState, useContext } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Alert, { AlertColor } from "@mui/material/Alert";
import CreateModule from "./create";
import { DeleteModule } from "./delete";
import Snackbar from "@mui/material/Snackbar";
import { moduleService } from "../../services/modules.service";
import { Module } from '../../types/modules';
import { AppContext } from "../../Context/AppContext";
import { appContextType } from "../../types";
import Typography from "@mui/material/Typography";

export const Modules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });
  const [createConfig, setCreateConfig] = React.useState<{
    visible: boolean;
    edit: boolean;
    module: Module | null;
  }>({ visible: false, edit: false, module: null });
  const [deleteConfig, setDeleteConfig] = React.useState<{
    visible: boolean;
    module: Module | null;
  }>({ visible: false, module: null });

  // Get permissions from context
  const { checkPermissions } = useContext(AppContext) as appContextType;
  const permissions = checkPermissions();

  const handleToastClose = () =>
    setToasts({ message: "", open: false, severity: undefined });

  const handleClickOpen = () =>
    setCreateConfig({ visible: true, edit: false, module: null });

  const handleEditOpen = (row: Module) =>
    setCreateConfig({ visible: true, edit: true, module: row });

  const handleClose = () =>
    setCreateConfig({ visible: false, edit: false, module: null });

  const handleDeleteOpen = (row: Module) =>
    setDeleteConfig({ visible: true, module: row });

  const handleDeleteClose = () => {
    setDeleteConfig({ visible: false, module: null });
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await moduleService.getModules();
      setModules(data);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setToasts({
        message: "Failed to fetch modules. Please try again later.",
        open: true,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) {
      setToasts({
        message: "You don't have permission to delete modules",
        open: true,
        severity: "error",
      });
      return;
    }

    try {
      const response = await moduleService.deleteModule(id);
      if (response.status === 204) {
        handleDeleteClose();
        setToasts({
          message: "Module deleted successfully",
          open: true,
          severity: "success",
        });
        fetchModules();
      } else {
        setToasts({
          message: response.message,
          open: true,
          severity: "error",
        });
      }
    } catch (er) {
      setToasts({
        message: (er as Error).message,
        open: true,
        severity: "error",
      });
    }
  };

  const handleSubmit = async (fields: Module, type: string) => {
    // Check permissions based on operation type
    if ((type === "create" || type === "edit") && !permissions.canWrite) {
      setToasts({
        message: `You don't have permission to ${type === "create" ? "create" : "edit"} modules`,
        open: true,
        severity: "error",
      });
      return;
    }

    try {
      if (type === "create") {
        const response = await moduleService.createModule(fields);
        if (response.status === 201) {
          setToasts({
            message: "Module record created successfully",
            open: true,
            severity: "success",
          });
          handleClose();
          fetchModules();
        } else {
          setToasts({
            message: response.message,
            open: true,
            severity: "error",
          });
        }
      } else if (type === "edit") {
        if (fields.id !== undefined) {
          const response = await moduleService.updateModule(
            fields.id,
            fields
          );
          if (response.status === 200) {
            setToasts({
              message: "Module record updated successfully",
              open: true,
              severity: "success",
            });
            handleClose();
            fetchModules();
          } else {
            setToasts({
              message: response.message,
              open: true,
              severity: "error",
            });
          }
        } else {
          throw new Error("Module ID is undefined");
        }
      }
    } catch (er) {
      setToasts({
        message: (er as Error).message,
        open: true,
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Modules</Typography>
            {/* Only show Add button if user has write permission */}
            {permissions.canWrite && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleClickOpen}
              >
                Add new module
              </Button>
            )}
          </Box>
          {modules.length > 0 ? (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Is Visible</TableCell>
                    <TableCell>Is Admin Module</TableCell>
                    <TableCell>Is Root Module</TableCell>
                    {/* Only show Actions column if user has edit/delete permission */}
                    {(permissions.canWrite || permissions.canDelete) && (
                      <TableCell align="right">Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.name}
                      </TableCell>
                      <TableCell>{row.url}</TableCell>
                      <TableCell>{row.isVisible.toString()}</TableCell>
                      <TableCell>{row.isAdminModule.toString()}</TableCell>
                      <TableCell>{row.isRootModule.toString()}</TableCell>
                      {/* Only show action buttons if user has permissions */}
                      {(permissions.canWrite || permissions.canDelete) && (
                        <TableCell align="right">
                          {permissions.canWrite && (
                            <IconButton
                              aria-label="edit"
                              size="small"
                              onClick={() => handleEditOpen(row)}
                            >
                              <PencilIcon fontSize="small" />
                            </IconButton>
                          )}
                          {permissions.canDelete && (
                            <IconButton
                              aria-label="delete"
                              size="small"
                              onClick={() => handleDeleteOpen(row)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No modules available. {permissions.canWrite ? "Create one by clicking on add new module." : ""}
            </Alert>
          )}
          <CreateModule
            open={createConfig}
            handleClose={handleClose}
            handleSubmit={handleSubmit}
          />
          <DeleteModule
            open={deleteConfig}
            handleClose={handleDeleteClose}
            handleDelete={handleDelete}
          />
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
        </>
      )}
    </>
  );
};
