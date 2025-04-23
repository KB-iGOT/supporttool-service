import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import React, { useContext } from "react";
import { appContextType } from "../../../types";
import { AppContext } from "../../../Context/AppContext";

export const Notification = () => {
  const { notification, setNotification } = useContext(
    AppContext
  ) as appContextType;

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={5000}
      onClose={handleCloseNotification}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={handleCloseNotification}
        severity={notification.severity}
        variant="filled"
        elevation={6}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};
