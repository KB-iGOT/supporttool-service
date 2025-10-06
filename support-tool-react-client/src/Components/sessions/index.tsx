import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../Context/AppContext';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Alert,
  Snackbar,
  AlertColor,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { sessionService }  from "../../services/sessions.service";
import { authService } from '../../services/authentication.service';
import { appContextType } from '../../types';
import { format } from 'date-fns';

interface Session {
  sid: string;
  sess: {
    user?: {
      name?: string;
      firstName?: string; // userName is what is used in the login response
      lastName?: string; // userName is what is used in the login response
    };
  };
  expire: string;
  user_id: string;
}

export const Sessions = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AppContext) as appContextType;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch sessions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDeleteClick = (sid: string) => {
    setSessionToDelete(sid);
    setIsClearingAll(false);
    setConfirmOpen(true);
  };

  const handleClearAllClick = () => {
    setSessionToDelete(null);
    setIsClearingAll(true);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setSessionToDelete(null);
    setIsClearingAll(false);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      if (isClearingAll) {
        await sessionService.deleteAllSessions();
        setToast({ open: true, message: 'All sessions cleared. Logging out.', severity: 'success' });
        await authService.logout();
        setIsLoggedIn(false);
        navigate('/login');
        return; // Exit early since we are navigating away
      } else if (sessionToDelete) {
        const isLastSession = sessions.length === 1;
        await sessionService.deleteSession(sessionToDelete);
        setToast({ open: true, message: 'Session deleted successfully.', severity: 'success' });
        if (isLastSession) {
          await authService.logout();
          setIsLoggedIn(false);
          navigate('/login');
          return; // Exit early
        }
      }
      fetchSessions();
    } catch (err) {
      setToast({ open: true, message: 'An error occurred.', severity: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
      handleConfirmClose();
    }
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Active Sessions
        </Typography>
        <Button variant="contained" color="error" onClick={handleClearAllClick} disabled={loading || sessions.length === 0}>
          Clear All Sessions
        </Button>
      </Box>

      {loading && <LinearProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Session ID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.sid}>
                  <TableCell>{session.sess.user?.name || 'N/A'}</TableCell>
                  <TableCell>{session.user_id || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(session.expire), 'Pp')}</TableCell>
                  <TableCell>{session.sid}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleDeleteClick(session.sid)} color="error" aria-label="delete session">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={confirmOpen} onClose={handleConfirmClose}>
        <DialogTitle>{isClearingAll ? 'Clear All Sessions?' : 'Delete Session?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isClearingAll
              ? 'Are you sure you want to delete all active sessions? This will log out all users.'
              : 'Are you sure you want to delete this session? This will log out the user.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={handleToastClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleToastClose} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};