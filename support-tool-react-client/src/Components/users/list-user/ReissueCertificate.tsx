import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { UserProfile } from '../../../types/users';

export const ReissueCertificate: React.FC = () => {
  // Use useLocation to access query parameters
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract userId from query parameters
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId');

  // State declarations
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user data when component mounts
  useEffect(() => {
    if (userId) {
    //   fetchUser(userId);
    } else {
      setError('No user ID provided. Cannot proceed with certificate re-issuance.');
    }
  }, [userId]);

  return (   
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Reissue Certificate
      </Typography>
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Paper>
      {error ? (
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
      ) : (
        <Typography variant="body1" gutterBottom>
          This feature is not yet implemented.
        </Typography>
      )}
    </Box>
  );
};