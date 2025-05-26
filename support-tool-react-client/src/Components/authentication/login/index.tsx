import React, { useContext, useState } from "react";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import logo from "../../../assets/logo.svg";
import Box from "@mui/material/Box";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { makeStyles, createStyles } from "@mui/styles";
import { authService } from "../../../services/authentication.service";
import { useNavigate } from "react-router-dom";
import { appContextType } from "../../../types";
import { AppContext } from "../../../Context/AppContext";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

const useStyles = makeStyles(() =>
  createStyles({
    container: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    logo: {
      width: "60%",
    },
    boxMargin: {
      marginBottom: "16px",
    },
    gridFlex: {
      display: "flex",
      justifyContent: "center",
      alignItems: "start",
    },
    divider: {
        width: "50%",
        margin: "2rem auto",
        border: "1px solid #ddd"
    },
    buttonProgress: {
      marginLeft: "10px"
    }
  })
);

export const Login: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { setIsLoggedIn, setNotification } = useContext(
    AppContext,
  ) as appContextType;
    
  const [fields, setFields] = useState<{username: string; password: string}>({
    username: "",
    password: "",
  });

  const submitForm = async() => {
    if (!fields.username || !fields.password) {
      setNotification({
        open: true,
        message: "Please enter both username and password",
        severity: "error",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authService.auth({ 
        username: fields.username, 
        password: fields.password 
      });
      
      if (response && response.status === 200) {
        console.log("Login successful:", response);
        localStorage.setItem("userId", response.userId);
        setIsLoggedIn(true);
        navigate("/home");
      } else {
        console.error("Login failed:", response);
        setNotification({
          open: true,
          message: response?.message || "Login failed. Please try again.",
          severity: "error",
        });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle different types of errors
      if (err.message === "Network Error") {
        setNotification({
          open: true,
          message: "Unable to connect to the server. Please check if the server is running.",
          severity: "error",
        });
      } else {
        setNotification({
          open: true,
          message: err?.response?.data?.message || err?.message || "An unexpected error occurred",
          severity: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" className={classes.container}>
      <Grid container spacing={2} className={classes.gridFlex}>
        <Grid item xs={12} lg={6}>
        <img src={logo} alt="Logo" className={classes.logo} />
          <hr className={classes.divider}/>
          <h3>Support Tool</h3>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Box mb={2}>
            <TextField 
              label="E-mail" 
              variant="outlined" 
              fullWidth 
              value={fields.username}
              onChange={(e) => setFields({...fields, username: e.target.value})} 
              disabled={isLoading}
            />
          </Box>
          <Box mb={2}>
            <TextField
              id="outlined-basic"
              label="Password"
              variant="outlined"
              required
              fullWidth
              type="password"
              value={fields.password}
              onChange={(e) => setFields({...fields, password: e.target.value})}
              disabled={isLoading}
            />
          </Box>
          <Box mb={2}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox defaultChecked size="small" />}
                label="Remember me"
              />
            </FormGroup>
          </Box>
          <Box mb={2}>
            <Button 
              variant="contained" 
              disabled={isLoading || (!fields.username || !fields.password)} 
              onClick={submitForm}
            >
              Sign in
              {isLoading && <CircularProgress size={20} className={classes.buttonProgress} />}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};