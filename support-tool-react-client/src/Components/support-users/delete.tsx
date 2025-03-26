import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";
import { User } from "../../types/users";

export const DeleteSupportUser: React.FC<{
  open: { visible: boolean; user: User | null };
  handleClose: () => void;
  handleDelete: (userId: string | undefined) => void;
}> = ({ open, handleClose, handleDelete }) => {
  return (
    <Dialog
      open={open.visible}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Delete {open.user?.firstName} {open.user?.lastName}'s Profile?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Are you sure you want to delete {open.user?.firstName}{" "}
          {open.user?.lastName}'s profile from the support system?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={() => handleDelete(open.user?.userId)} autoFocus>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
