import { createStyles, makeStyles } from "@mui/styles";
import React, { useContext, useState } from "react";
import { Fab } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { AppContext } from "../../../Context/AppContext";
import { appContextType } from "../../../types";

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      width: "calc(254px - 2rem)",
      height: "calc(100vh - 68.5px)",
      position: "fixed",
      top: '68.5px',
      backgroundColor: "#FFFFFF",
      padding: "1rem",
      boxShadow: "0 10px 12px 0 rgba(0,0,0,0.25)",
    },
  })
);

export const Sidebar = () => {
    const { isLoggedIn } = useContext(
      AppContext,
    ) as appContextType;
  const classes = useStyles();
  const [collapsed, setCollapsed] = useState(true);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (!collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  };

  return (
    isLoggedIn ?
    <div className={classes.root} style={{ width: collapsed ? "calc(80px - 2rem)" : "calc(254px - 2rem)" }}>
        <Fab variant="extended" onClick={toggleSidebar} size="small" style={{top: '50%',
    position: 'absolute',
    right: '-18px'}}>
            {!collapsed && <ChevronLeftIcon fontSize="small" />}
            {collapsed && <ChevronRightIcon fontSize="small" />}
        </Fab>
      {!collapsed && <div>Sidebar Content</div>}
    </div> : null
  );
};
