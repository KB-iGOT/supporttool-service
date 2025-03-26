import { createStyles, makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { Fab } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      width: "254px",
      height: "calc(100vh - 68.5px)",
      position: "sticky",
      top: 0,
      backgroundColor: "#FFFFFF",
      padding: "1rem",
      boxShadow: "0 10px 12px 0 rgba(0,0,0,0.25)",
    },
  })
);

export const Sidebar = () => {
  const classes = useStyles();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (!collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  };

  return (
    <div className={classes.root} style={{ width: collapsed ? "80px" : "254px" }}>
        <Fab variant="extended" onClick={toggleSidebar} size="small" style={{top: '50%',
    position: 'absolute',
    right: '-18px'}}>
            {!collapsed && <ChevronLeftIcon fontSize="small" />}
            {collapsed && <ChevronRightIcon fontSize="small" />}
        </Fab>
      {!collapsed && <div>Sidebar Content</div>}
    </div>
  );
};
