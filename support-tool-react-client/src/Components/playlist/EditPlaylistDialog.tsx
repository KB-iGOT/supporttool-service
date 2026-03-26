import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Alert, Box, Typography,
  IconButton, Chip, InputAdornment, Autocomplete,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Business as BusinessIcon } from '@mui/icons-material';
import { playlistService } from '../../services/playlist.service';
import { organisationService } from '../../services/organisations.service';
import { useActionIntercept } from '../../Context/AppContext';

interface OrgOption {
  identifier: string;
  channel: string;
}

interface PlaylistData {
  id?: string;
  type: string;
  orgId: string;
  ownerId: string;
  children: string[];
  [key: string]: any;
}

interface EditPlaylistDialogProps {
  open: boolean;
  playlist: PlaylistData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPlaylistDialog: React.FC<EditPlaylistDialogProps> = ({ open, playlist, onClose, onSuccess }) => {
  const { interceptAction } = useActionIntercept();
  const [type, setType] = useState('');
  const [orgId, setOrgId] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [ownerId, setOwnerId] = useState('');
  const [childInput, setChildInput] = useState('');
  const [children, setChildren] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Org search
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const orgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchOrgs = useCallback(async (query: string) => {
    setOrgLoading(true);
    try {
      const response = await organisationService.fetchOrganisationsData({
        request: {
          filters: { status: 1 },
          fields: ['identifier', 'channel'],
          sortBy: { createdDate: 'Desc' },
          limit: 20,
          offset: 0,
          query,
        },
      });
      setOrgOptions(response?.result?.response?.content || []);
    } catch {
      setOrgOptions([]);
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && playlist) {
      setType(playlist.type || '');
      setOrgId(playlist.orgId || '');
      setSelectedOrg(playlist.orgId ? { identifier: playlist.orgId, channel: playlist.orgId } : null);
      setOwnerId(playlist.ownerId || '');
      setChildren(playlist.children || []);
      setChildInput('');
      setError('');
      searchOrgs('');
    }
  }, [open, playlist, searchOrgs]);

  const handleOrgInputChange = (_e: any, value: string) => {
    if (orgTimer.current) clearTimeout(orgTimer.current);
    orgTimer.current = setTimeout(() => searchOrgs(value), 300);
  };

  const handleOrgSelect = (_e: any, value: string | OrgOption | null) => {
    if (typeof value === 'string') {
      setSelectedOrg(null);
      setOrgId(value);
    } else {
      setSelectedOrg(value);
      setOrgId(value?.identifier || '');
    }
  };

  const handleAddChild = () => {
    const trimmed = childInput.trim();
    if (trimmed && !children.includes(trimmed)) {
      setChildren(prev => [...prev, trimmed]);
      setChildInput('');
    }
  };

  const handleRemoveChild = (id: string) => {
    setChildren(prev => prev.filter(c => c !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChild();
    }
  };

  const handleUpdate = async () => {
    if (!type.trim()) { setError('Type is required'); return; }
    if (!orgId.trim()) { setError('Org ID is required'); return; }
    if (!ownerId.trim()) { setError('Owner ID is required'); return; }
    if (children.length === 0) { setError('At least one content ID is required'); return; }
    setError('');

    const actionPayload = {
      requestPayload: {
        type: type.trim(),
        orgId: orgId.trim(),
        ownerId: ownerId.trim(),
        children,
      },
      count: 1,
    };

    interceptAction('PLAYLIST', actionPayload, async (auditData: any) => {
      setSaving(true);
      try {
        await playlistService.updatePlaylist(auditData);
        onSuccess();
        onClose();
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message || err?.response?.data?.responseMessage || err.message || 'Failed to update playlist';
        setError(msg);
      } finally {
        setSaving(false);
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Edit Playlist
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth size="small" label="Type" required
          value={type} onChange={e => setType(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Autocomplete<OrgOption, false, false, true>
          size="small"
          freeSolo
          options={orgOptions}
          getOptionLabel={(opt) => typeof opt === 'string' ? opt : `${opt.channel} (${opt.identifier})`}
          value={selectedOrg}
          onChange={handleOrgSelect}
          onInputChange={handleOrgInputChange}
          loading={orgLoading}
          filterOptions={(x) => x}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Organization" required
              placeholder="Search org by name or enter Org ID..."
              value={orgId}
              onChange={e => { if (!selectedOrg) setOrgId(e.target.value); }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {orgLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={typeof option === 'string' ? option : option.identifier}>
              {typeof option === 'string' ? option : <>{option.channel} <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({option.identifier})</Typography></>}
            </li>
          )}
          noOptionsText="No organizations found"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth size="small" label="Owner ID" required
          value={ownerId} onChange={e => setOwnerId(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Content IDs (Children)</Typography>
        <TextField
          fullWidth size="small" label="Add Content ID"
          value={childInput}
          onChange={e => setChildInput(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleAddChild} disabled={!childInput.trim()}>
                  <AddIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, maxHeight: 150, overflowY: 'auto' }}>
          {children.map(id => (
            <Chip key={id} label={id} size="small" onDelete={() => handleRemoveChild(id)} />
          ))}
        </Box>
        {children.length > 0 && (
          <Typography variant="caption" color="text.secondary">{children.length} content(s)</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleUpdate} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPlaylistDialog;
