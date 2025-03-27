import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";
import { Module } from "../../types/modules";

export const DeleteModule: React.FC<{
  open: { visible: boolean; module: Module | null };
  handleClose: () => void;
  handleDelete: (id: number) => void;
}> = ({ open, handleClose, handleDelete }) => {
  return (
    <Dialog
      open={open.visible}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Delete {open.module?.name} module?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Are you sure you want to delete {open.module?.name} module from the support system?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={() => open.module && open.module.id !== undefined && handleDelete(open.module.id)} autoFocus>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
