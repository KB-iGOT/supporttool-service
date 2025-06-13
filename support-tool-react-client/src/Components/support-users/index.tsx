import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useEffect, useState } from "react";
import { ICreateUser, User } from "../../types/users";
import { supportUserService } from "../../services/support-users.service";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import PencilIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Alert, { AlertColor } from "@mui/material/Alert";
import CreateSupportUser from "./create";
import { DeleteSupportUser } from "./delete";
import Snackbar from "@mui/material/Snackbar";
import { rolesService } from "../../services/roles.service";

export const SupportUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });
  const [createConfig, setCreateConfig] = React.useState<{
    visible: boolean;
    edit: boolean;
    user: User | null;
  }>({ visible: false, edit: false, user: null });
  const [deleteConfig, setDeleteConfig] = React.useState<{
    visible: boolean;
    user: User | null;
  }>({ visible: false, user: null });

  const handleToastClose = () =>
    setToasts({ message: "", open: false, severity: undefined });

  const handleClickOpen = () =>
    setCreateConfig({ visible: true, edit: false, user: null });

  const handleEditOpen = (row: User) =>
    setCreateConfig({ visible: true, edit: true, user: row });

  const handleClose = () =>
    setCreateConfig({ visible: false, edit: false, user: null });

  const handleDeleteOpen = (row: User) =>
    setDeleteConfig({ visible: true, user: row });

  const handleDeleteClose = () => {
    setDeleteConfig({ visible: false, user: null });
  };

  const handleDelete = async (userId: string | undefined) => {
    try {
      const response = await supportUserService.deleteUser(userId);
      if (response.status === 204) {
        handleDeleteClose();
        setToasts({
          message: "User deleted successfully",
          open: true,
          severity: "success",
        });
        fetchUsers();
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await supportUserService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (fields: ICreateUser, type: string) => {
    try {
      if (type === "create") {
        const response = await supportUserService.createUser(fields);
        if (response.status === 201) {
          setToasts({
            message: "User record created successfully",
            open: true,
            severity: "success",
          });
          handleClose();
          fetchUsers();
        } else {
          setToasts({
            message: response.message,
            open: true,
            severity: "error",
          });
        }
      } else if (type === "edit") {
        const response = await supportUserService.updateUser(
          fields.userId,
          fields
        );
        if (response.status === 200) {
          setToasts({
            message: "User record updated successfully",
            open: true,
            severity: "success",
          });
          handleClose();
          fetchUsers();
        } else {
          setToasts({
            message: response.message,
            open: true,
            severity: "error",
          });
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
  const getRoles = async () => {
    try {
      const rolesData = await rolesService.getRoles();
      if (rolesData && rolesData.responseCode === "OK") {
        setRoles(rolesData.roles || []);
      } else {
        throw new Error(rolesData?.responseMessage || "Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setToasts({
        message: "Failed to load roles",
        open: true,
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    getRoles();
  }, []);

  return (
    <>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
            >
              Add new support user
            </Button>
          </Box>
          {users.length > 0 ? (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.firstName} {row.lastName}
                      </TableCell>
                      <TableCell>{row.userName}</TableCell>
                      <TableCell>{row.userId}</TableCell>
                      <TableCell>
                        {Array.isArray(row.roles)
                          ? row.roles.map((role) => role.role_name).join(", ")
                          : ""}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="edit"
                          size="small"
                          onClick={() => handleEditOpen(row)}
                        >
                          <PencilIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          size="small"
                          onClick={() => handleDeleteOpen(row)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No support users available. Create one by clicking on add new
              support user.
            </Alert>
          )}
          <CreateSupportUser
            open={createConfig}
            rolesList={roles}
            handleClose={handleClose}
            handleSubmit={handleSubmit}
          />
          <DeleteSupportUser
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
