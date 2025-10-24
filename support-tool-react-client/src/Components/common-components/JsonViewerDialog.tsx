import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Typography,
} from '@mui/material';
import Editor from '@monaco-editor/react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface JsonViewerDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  identifier?: string;
  data: object | null;
}

export const JsonViewerDialog: React.FC<JsonViewerDialogProps> = ({
  open,
  onClose,
  title,
  identifier,
  data,
}) => {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const handleCopy = (textToCopy: string | undefined, type: string) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setSnackbarMessage(`${type} copied to clipboard`);
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  const jsonData = data ? JSON.stringify(data, null, 2) : '{}';

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => reason !== 'backdropClick' && onClose()}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="span">
            {title}
          </Typography>
          <Tooltip title="Copy Title">
            <IconButton onClick={() => handleCopy(title, 'Title')} size="small">
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
        {identifier && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {identifier}
            <Tooltip title="Copy Identifier">
              <IconButton onClick={() => handleCopy(identifier, 'Identifier')} size="small">
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ height: '70vh' }}>
        <Box sx={{ height: '100%', border: '1px solid #ccc' }}>
          <Editor
            height="100%"
            language="json"
            value={jsonData}
            options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false } }}
            loading={<CircularProgress />}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Dialog>
  );
};