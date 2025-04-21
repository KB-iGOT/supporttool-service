import React, { useContext } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AdbIcon from "@mui/icons-material/Adb";
import logo from "../../../assets/logo.svg";
import { makeStyles, createStyles } from "@mui/styles";
import { authService } from "../../../services/authentication.service";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import { appContextType } from "../../../types";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

const useStyles = makeStyles(() =>
  createStyles({
    logo: {
      width: "250px",
      height: "100%",
    },
    container:{
        padding: '0 2rem',
        background: '#FFF'
    },
    customHeader:{
        background: '#FFFFFF',
        '& .MuiToolbar-root': {
          justifyContent: 'space-between',
        },
        '&.fixed':{
          position: 'fixed !important',
          zIndex: 1111
        }
    }
  })
);

export const Header = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(
    AppContext,
  ) as appContextType;
  
  const classes = useStyles();
  const navigate = useNavigate();
  
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const triggerMenuClick = async (setting: string) => {
    if (setting === "Logout") {
      await authService.logout();
      setIsLoggedIn(false);
      navigate("/login");
    }else{

    }
  }

  return (
    <>
      {isLoggedIn ? (
          <AppBar position="static" className={`${classes.customHeader} fixed`}>
            <div className={classes.container}>
              <Toolbar disableGutters>
                <img src={logo} alt="Logo" className={classes.logo} />

                <AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
                <Typography
                  variant="h5"
                  noWrap
                  component="a"
                  href="#app-bar-with-responsive-menu"
                  sx={{
                    mr: 2,
                    display: { xs: "flex", md: "none" },
                    flexGrow: 1,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    letterSpacing: ".3rem",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  LOGO
                </Typography>
                <Box sx={{ flexGrow: 0 }}>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar
                        alt="Remy Sharp"
                        src="/static/images/avatar/2.jpg"
                      />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: "45px" }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    {settings.map((setting) => (
                      <MenuItem key={setting} onClick={() => triggerMenuClick(setting)} >
                        <Typography sx={{ textAlign: "center" }}
                        >
                          {setting}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              </Toolbar>
            </div>
          </AppBar>
      ) : null}
    </>
  );
};
