import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { ICreateUser, User } from "../../types/users";
import DEFAULT from "../../Config/Defaults";

const CreateSupportUser: React.FC<{
  open: { visible: boolean; edit: boolean; user: User | null };
  handleClose: () => void;
  handleSubmit: (fields: ICreateUser, type: string) => void;
}> = ({ open, handleClose, handleSubmit }) => {
  const [fields, setFields] = React.useState<ICreateUser>(DEFAULT.CREATE_USER);

  const handleRoleChange = (event: SelectChangeEvent) => {
    setFields({ ...fields, roles: event.target.value as string });
  };

  React.useMemo(() => {
    if (open.edit) {
      setFields({
        userId: open.user?.userId,
        userName: open.user?.userName,
        firstName: open.user?.firstName,
        lastName: open.user?.lastName,
        roles: open.user?.roles,
      });
    } else {
      setFields(DEFAULT.CREATE_USER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <React.Fragment>
      <Dialog
        open={open.visible}
        onClose={handleClose}
        slotProps={{
          paper: {
            component: "form",
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              handleSubmit(fields, open.edit ? "edit" : "create");
            },
          },
        }}
      >
        <DialogTitle className="padding-1-2">
          {open.edit ? "Edit support user" : "Add new support user"}
        </DialogTitle>
        <DialogContent className="dialog-content-container">
          <DialogContentText>
            Provide user's email. Please note that the user's email should be
            available in the IGot system to add them here.
          </DialogContentText>
          <FormControl fullWidth>
            <TextField
              autoFocus
              autoComplete="off"
              required
              margin="dense"
              id="userId"
              name="userId"
              label="User ID"
              type="text"
              fullWidth
              variant="outlined"
              value={fields.userId}
              onChange={(e) => setFields({ ...fields, userId: e.target.value })}
              disabled={open.edit}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              autoComplete="off"
              required
              margin="dense"
              id="userName"
              name="userName"
              label="Username / E-mail"
              type="text"
              fullWidth
              variant="outlined"
              value={fields.userName}
              onChange={(e) =>
                setFields({ ...fields, userName: e.target.value })
              }
              disabled={open.edit}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              autoComplete="off"
              required
              margin="dense"
              id="firstName"
              name="firstName"
              label="First Name"
              type="text"
              fullWidth
              variant="outlined"
              value={fields.firstName}
              onChange={(e) =>
                setFields({ ...fields, firstName: e.target.value })
              }
              disabled={open.edit}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              autoComplete="off"
              required
              margin="dense"
              id="lastName"
              name="lastName"
              label="Last Name"
              type="text"
              fullWidth
              variant="outlined"
              value={fields.lastName}
              onChange={(e) =>
                setFields({ ...fields, lastName: e.target.value })
              }
              disabled={open.edit}
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="roles-label" required>
              Assign role
            </InputLabel>
            <Select
              labelId="roles-label"
              id="roles"
              value={fields.roles}
              label="Assign role"
              onChange={handleRoleChange}
              required
            >
              <MenuItem value="admin">ADMIN</MenuItem>
              <MenuItem value="user">USER</MenuItem>
              <MenuItem value="viewer">VIEWER</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions className="padding-1-2">
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              !fields.userId ||
              !fields.userName ||
              !fields.firstName ||
              !fields.lastName ||
              !fields.roles
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default CreateSupportUser;
