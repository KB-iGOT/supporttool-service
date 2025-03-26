import React from "react";
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
import { useNavigate } from "react-router-dom";

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

  const submitForm = () => {
    navigate('/home');
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
            <TextField label="E-mail" variant="outlined" fullWidth />
          </Box>
          <Box mb={2}>
            <TextField
              id="outlined-basic"
              label="Password"
              variant="outlined"
              required
              fullWidth
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
            <Button variant="contained" onClick={submitForm}>Sign in</Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
