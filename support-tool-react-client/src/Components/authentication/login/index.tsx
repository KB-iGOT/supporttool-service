import React, { useContext, useState } from "react";
import TextField from "@mui/material/TextField";
import logo from "../../../assets/logo.svg";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { authService } from "../../../services/authentication.service";
import { useNavigate } from "react-router-dom";
import { appContextType } from "../../../types";
import { AppContext } from "../../../Context/AppContext";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setIsLoggedIn, setNotification, setUser, setModulePermissions } = useContext(
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
        const userSessionData = response.data;
        localStorage.setItem("userId", userSessionData.id);
        setUser(userSessionData);
        if (userSessionData && userSessionData.rolePermissions) {
          const permissionsMap: Record<string, any> = {};
          userSessionData.rolePermissions.forEach((permission: any) => {
            permissionsMap[permission.module_url] = permission;
          });
          setModulePermissions(permissionsMap);
        }
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

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      submitForm();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
// linear-gradient(135deg, #1f3c85 0%, #2e58b5 100%)
  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'linear-gradient(238deg, #f0951e 0%, #1f3c85 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          p: 4
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Logo"
          sx={{
            width: '250px',
            marginBottom: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxSizing: 'border-box',
          }} />
        <Typography component="h1" variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Support Tool
        </Typography>
        <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
          iGOT Karmayogi
        </Typography>
      </Grid>
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            mx: 4,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            Sign In
          </Typography>
          <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); submitForm(); }} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Email Address"
              name="username"
              autoComplete="email"
              autoFocus
              value={fields.username}
              onChange={(e) => setFields({ ...fields, username: e.target.value })}
              disabled={isLoading}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={fields.password}
              onChange={(e) => setFields({ ...fields, password: e.target.value })}
              disabled={isLoading}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !fields.username || !fields.password}
              sx={{ 
                mt: 3, mb: 2, py: 1.5, borderRadius: '8px', fontWeight: 'bold',
                backgroundColor: '#f0951e',
                '&:hover': {
                  backgroundColor: '#e68a1a'
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            <Grid container>
              <Grid item xs>
                {/* Future link for forgot password */}
              </Grid>
              <Grid item>
                {/* Future link for sign up */}
              </Grid>
            </Grid>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5 }}>
              {'Copyright © '}
              iGOT Karmayogi {new Date().getFullYear()}
              {'.'}
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};