import React, { useState, useEffect } from "react";
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
import DEFAULT from "../../Config/Defaults";
import { Module } from "../../types/modules";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

const CreateModule: React.FC<{
  open: { visible: boolean; edit: boolean; module: Module | null };
  handleClose: () => void;
  handleSubmit: (fields: Module, type: string) => void;
}> = ({ open, handleClose, handleSubmit }) => {
  const [fields, setFields] = useState<Module>(DEFAULT.CREATE_MODULE);

  const handleRoleChange = (event: SelectChangeEvent) => {
    setFields({ ...fields, roles: [event.target.value] });
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    switch(type){
      case 'isVisible':
        setFields({ ...fields, isVisible: event.target.checked });
        break;
      case 'isAdminModule':
        setFields({ ...fields, isAdminModule: event.target.checked });
        break;
      case 'isRootModule':
        setFields({ ...fields, isRootModule: event.target.checked });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (open.edit && open.module) {
      setFields({
        id: open.module.id,
        name: open.module.name,
        url: open.module.url,
        roles: open.module.roles || [],
        isVisible: open.module.isVisible,
        isAdminModule: open.module.isAdminModule,
        isRootModule: open.module.isRootModule,
      });
    } else {
      setFields(DEFAULT.CREATE_MODULE);
    }
  }, [open]);

  const isFormValid = () => {
    if (!fields.name) return false;
    if (!open.edit && !fields.url) return false;
    return true;
  };

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
          {open.edit ? "Edit module" : "Add new module"}
        </DialogTitle>
        <DialogContent className="dialog-content-container">
          <DialogContentText>
            {open.edit 
              ? "Update module details. URL cannot be changed after creation."
              : "Create a new module by providing the details below."}
          </DialogContentText>
          <FormControl fullWidth>
            <TextField
              autoFocus
              autoComplete="off"
              required
              margin="dense"
              id="name"
              name="name"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              value={fields.name}
              onChange={(e) => setFields({ ...fields, name: e.target.value })}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              autoComplete="off"
              required={!open.edit}
              margin="dense"
              id="url"
              name="url"
              label="URL"
              type="text"
              fullWidth
              variant="outlined"
              value={fields.url}
              onChange={(e) => setFields({ ...fields, url: e.target.value })}
              disabled={open.edit}
              helperText={open.edit ? "URL cannot be changed after creation" : ""}
            />
          </FormControl>
          <FormControl fullWidth>
            <FormControlLabel
              control={
                <Switch
                  checked={!!fields.isVisible}
                  onChange={(e) => handleSwitchChange(e, 'isVisible')}
                  inputProps={{ "aria-label": "controlled" }}
                />
              }
              label="Is Visible?"
            />
          </FormControl>
          <FormControl fullWidth>
            <FormControlLabel
              control={
                <Switch
                  checked={!!fields.isAdminModule}
                  onChange={(e) => handleSwitchChange(e, 'isAdminModule')}
                  inputProps={{ "aria-label": "controlled" }}
                />
              }
              label="Is Admin Module?"
            />
          </FormControl>
          <FormControl fullWidth>
            <FormControlLabel
              control={
                <Switch
                  checked={!!fields.isRootModule}
                  onChange={(e) => handleSwitchChange(e, 'isRootModule')}
                  inputProps={{ "aria-label": "controlled" }}
                />
              }
              label="Is Root Module?"
            />
          </FormControl>
        </DialogContent>
        <DialogActions className="padding-1-2">
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid()}
          >
            {open.edit ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default CreateModule;
