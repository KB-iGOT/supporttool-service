import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArticleIcon from '@mui/icons-material/Article';
import LockIcon from '@mui/icons-material/Lock';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { contentsService } from '../../../services/contents.service';
import { JsonEditor } from '../../common-components/json-editor/json-editor';

type FetchOption = 'read' | 'access' | 'hierarchy';

interface PanelState {
  loading: boolean;
  error: string | null;
  data: any;
}

const OPTION_META: { key: FetchOption; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'read',      label: 'Content Read',     icon: <ArticleIcon fontSize="small" />,     color: '#1976d2' },
  { key: 'access',    label: 'Access Settings',   icon: <LockIcon fontSize="small" />,        color: '#7b1fa2' },
  { key: 'hierarchy', label: 'Hierarchy',         icon: <AccountTreeIcon fontSize="small" />, color: '#388e3c' },
];

const EMPTY_PANEL: PanelState = { loading: false, error: null, data: null };

export const ContentAccessTab: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [selected, setSelected] = useState<FetchOption[]>(['read', 'access']);
  const [panels, setPanels] = useState<Record<FetchOption, PanelState>>({
    read:      { ...EMPTY_PANEL },
    access:    { ...EMPTY_PANEL },
    hierarchy: { ...EMPTY_PANEL },
  });
  const [copiedKey, setCopiedKey] = useState<FetchOption | null>(null);
  const [lastFetchedId, setLastFetchedId] = useState('');

  const setPanel = (key: FetchOption, update: Partial<PanelState>) => {
    setPanels((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));
  };

  const handleToggle = (_: React.MouseEvent<HTMLElement>, newSelected: FetchOption[]) => {
    if (newSelected.length > 0) setSelected(newSelected);
  };

  const fetchOne = useCallback(async (key: FetchOption, id: string) => {
    setPanel(key, { loading: true, error: null, data: null });
    try {
      let response: any;
      if (key === 'read')      response = await contentsService.getContentDetails(id);
      if (key === 'access')    response = await contentsService.getAccessSettings(id);
      if (key === 'hierarchy') response = await contentsService.getContentHierarchy(id);
      const result = response?.result !== undefined ? response.result : response;
      setPanel(key, { loading: false, data: result, error: null });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.responseMessage ||
        err?.message ||
        `Failed to fetch ${key}`;
      setPanel(key, { loading: false, error: msg, data: null });
    }
  }, []);

  const handleFetch = () => {
    const id = identifier.trim();
    if (!id) return;
    setLastFetchedId(id);
    selected.forEach((key) => fetchOne(key, id));
  };

  const handleRefreshOne = (key: FetchOption) => {
    const id = lastFetchedId || identifier.trim();
    if (!id) return;
    fetchOne(key, id);
  };

  const handleCopy = (key: FetchOption, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const activePanels = OPTION_META.filter((o) => selected.includes(o.key));
  const panelWidth = activePanels.length === 1 ? '100%' : activePanels.length === 2 ? '50%' : '33.33%';

  return (
    <Box>
      {/* Controls */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
          Content Lookup
        </Typography>

        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          {/* Identifier input */}
          <TextField
            label="Content Identifier"
            placeholder="e.g. do_113..."
            size="small"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            sx={{ minWidth: 320 }}
          />

          {/* Option toggles */}
          <ToggleButtonGroup
            value={selected}
            onChange={handleToggle}
            size="small"
            color="primary"
          >
            {OPTION_META.map(({ key, label, icon }) => (
              <ToggleButton key={key} value={key} sx={{ gap: 0.5, textTransform: 'none' }}>
                {icon}
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Fetch button */}
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleFetch}
            disabled={!identifier.trim() || selected.length === 0}
          >
            Fetch
          </Button>
        </Box>

        {lastFetchedId && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Showing results for:{' '}
              <Chip label={lastFetchedId} size="small" sx={{ ml: 0.5, fontFamily: 'monospace' }} />
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Split window panels */}
      <Box display="flex" gap={1} alignItems="flex-start" sx={{ minHeight: 500 }}>
        {activePanels.map(({ key, label, icon, color }) => {
          const panel = panels[key];
          return (
            <Box
              key={key}
              sx={{
                width: panelWidth,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'grey.50',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box display="flex" alignItems="center" gap={0.75}>
                  <Box sx={{ color }}>{icon}</Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color }}>
                    {label}
                  </Typography>
                  {panel.loading && <CircularProgress size={14} sx={{ ml: 0.5 }} />}
                </Box>
                <Box display="flex" gap={0.5}>
                  <Tooltip title="Refresh">
                    <span>
                      <IconButton
                        size="small"
                        disabled={!lastFetchedId || panel.loading}
                        onClick={() => handleRefreshOne(key)}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={copiedKey === key ? 'Copied!' : 'Copy JSON'}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!panel.data}
                        onClick={() => panel.data && handleCopy(key, panel.data)}
                        color={copiedKey === key ? 'success' : 'default'}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>

              {/* Panel body */}
              <Box sx={{ flex: 1, minHeight: 460 }}>
                {panel.error ? (
                  <Box p={1.5}>
                    <Alert severity="error" sx={{ fontSize: 12 }}>
                      {panel.error}
                    </Alert>
                  </Box>
                ) : !panel.data && !panel.loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 460,
                      color: 'text.disabled',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ color, opacity: 0.3, fontSize: 40 }}>{icon}</Box>
                    <Typography variant="body2" color="text.disabled">
                      Enter an identifier and click Fetch
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 460 }} key={`${key}-${lastFetchedId}-${panel.loading}`}>
                    <JsonEditor
                      input={panel.loading ? null : panel.data}
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
                        automaticLayout: false,
                        scrollbar: { vertical: 'auto', horizontal: 'auto', alwaysConsumeMouseWheel: false },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
