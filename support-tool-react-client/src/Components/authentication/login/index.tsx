import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
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
import Snackbar from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";

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
    }
  })
);

export const Login: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const [fields, setFields] = useState<{username: string; password: string}>({
    username: "",
    password: "",
  })

  const [toasts, setToasts] = useState<{
    message: string;
    open: boolean;
    severity: AlertColor | undefined;
  }>({ message: "", open: false, severity: undefined });

  
  const handleToastClose = () =>
    setToasts({ message: "", open: false, severity: undefined });

  const submitForm = async() => {
    try{
      const response = await authService.auth({ username: fields.username, password: fields.password });
      if(response.status === 200){
        navigate("/home");
      }else{
        setToasts({
          message: response.message,
          open: true,
          severity: "error"
        })
      }
    }catch(err){
      console.error(err);
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
            <TextField label="E-mail" variant="outlined" fullWidth value={
              fields.username
            } onChange={(e)=> 
            setFields({...fields, username: e.target.value})
            } />
          </Box>
          <Box mb={2}>
            <TextField
              id="outlined-basic"
              label="Password"
              variant="outlined"
              required
              fullWidth
              value={fields.password}
              onChange={(e) => setFields({...fields, password: e.target.value})}
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
            <Button variant="contained" disabled={!fields.username && !fields.password} onClick={submitForm}>Sign in</Button>
          </Box>
        </Grid>
      </Grid>
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
    </Container>
  );
};
