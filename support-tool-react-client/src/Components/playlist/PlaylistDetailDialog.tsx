import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Alert, Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { playlistService } from '../../services/playlist.service';
import { JsonEditor } from '../common-components/json-editor/json-editor';

interface PlaylistDetailDialogProps {
  open: boolean;
  playlistData: any;
  orgId: string;
  onClose: () => void;
}

export const PlaylistDetailDialog: React.FC<PlaylistDetailDialogProps> = ({ open, playlistData, orgId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && playlistData && orgId) {
      fetchPlaylist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playlistData, orgId]);

  const fetchPlaylist = async () => {
    setLoading(true);
    setError('');
    try {
      let key = `${playlistData.orgId}${playlistData.type}`;
      const response = await playlistService.readPlaylist(key, orgId);
      setPlaylist(response?.result || response);
    } catch (err: any) {
      const msg = err?.response?.data?.responseMessage || err.message || 'Failed to fetch playlist details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Playlist Details
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!loading && playlist && (
          <Box sx={{ height: 500 }}>
            <JsonEditor
              input={playlist}
              onChange={() => {}}
              customOptions={{
                readOnly: true,
                domReadOnly: true,
                wordWrap: 'on',
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                folding: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                scrollbar: { vertical: 'auto', horizontal: 'auto', alwaysConsumeMouseWheel: false },
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlaylistDetailDialog;
