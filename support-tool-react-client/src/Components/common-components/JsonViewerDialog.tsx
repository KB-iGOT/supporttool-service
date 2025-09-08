import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import Editor from '@monaco-editor/react';

interface JsonViewerDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: object | null;
}

export const JsonViewerDialog: React.FC<JsonViewerDialogProps> = ({
  open,
  onClose,
  title,
  data,
}) => {
  const jsonData = data ? JSON.stringify(data, null, 2) : '{}';

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => reason !== 'backdropClick' && onClose()}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
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
    </Dialog>
  );
};