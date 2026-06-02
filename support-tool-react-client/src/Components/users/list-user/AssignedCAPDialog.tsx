import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { UserProfile } from '../../../types/users';
import { usersService } from '../../../services/users.service';

interface ContentItem {
  name?: string;
  identifier?: string;
  primaryCategory?: string;
  status?: string;
  contentType?: string;
  creator?: string;
  duration?: string;
  description?: string;
  mimeType?: string;
  courseCategory?: string;
  difficultyLevel?: string;
  lastPublishedOn?: string;
  createdOn?: string;
  leafNodesCount?: number;
  pkgVersion?: number;
  framework?: string;
  appIcon?: string;
  [key: string]: any;
}

interface AssignedCAPDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const AssignedCAPDialog: React.FC<AssignedCAPDialogProps> = ({ open, onClose, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  const email = user?.profileDetails?.personalDetails?.primaryEmail || user?.email || '';
  const userId = user?.userId || user?.identifier || user?.id || '';
  const rootOrgId = user?.rootOrgId || '';

  useEffect(() => {
    if (open && userId) {
      fetchAssignedCAP();
    }
    if (!open) {
      setData(null);
      setError(null);
      setLoading(false);
      setSearchQuery('');
      setExpandedAccordion(false);
    }
  }, [open]);

  const fetchAssignedCAP = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await usersService.getAssignedCAP(userId, rootOrgId);
      setData(response);
    } catch (err: any) {
      const msg =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch assigned CAP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const contentItems: ContentItem[] = useMemo(() => {
    return data?.result?.content || [];
  }, [data]);

  const totalCount: number = data?.result?.count || contentItems.length;

  /** Filter content items based on search query matching name or identifier */
  const filteredItems: ContentItem[] = useMemo(() => {
    if (!searchQuery.trim()) return contentItems;
    const query = searchQuery.toLowerCase().trim();
    return contentItems.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.identifier?.toLowerCase().includes(query)
    );
  }, [contentItems, searchQuery]);

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleAccordionChange = (panelId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panelId : false);
  };

  const CONTENT_DISPLAY_FIELDS: { key: string; label: string }[] = [
    { key: 'identifier', label: 'Identifier' },
    { key: 'primaryCategory', label: 'Category' },
    { key: 'courseCategory', label: 'Course Category' },
    { key: 'status', label: 'Status' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'creator', label: 'Creator' },
    { key: 'duration', label: 'Duration (sec)' },
    { key: 'difficultyLevel', label: 'Difficulty' },
    { key: 'mimeType', label: 'MIME Type' },
    { key: 'leafNodesCount', label: 'Leaf Nodes' },
    { key: 'pkgVersion', label: 'Version' },
    { key: 'framework', label: 'Framework' },
    { key: 'lastPublishedOn', label: 'Last Published' },
    { key: 'createdOn', label: 'Created On' },
  ];

  const renderContentCard = (content: ContentItem, index: number) => (
    <Card
      key={content.identifier || index}
      variant="outlined"
      sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
          {content.name || 'Unnamed Content'}
        </Typography>
        {content.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {content.description}
          </Typography>
        )}
        <Grid container spacing={1}>
          {CONTENT_DISPLAY_FIELDS.map(({ key, label }) => {
            const value = content[key];
            if (value === null || value === undefined || value === '') return null;
            return (
              <Grid item xs={12} sm={6} key={key}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 110 }}>
                    {label}:
                  </Typography>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SchoolIcon color="primary" />
        Assigned CAP (Comprehensive Assessment Program)
      </DialogTitle>

      <DialogContent dividers>
        {/* User info summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            User:{' '}
            <strong>
              {user?.firstName} {user?.lastName || ''}
            </strong>
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Email: <strong>{email || '—'}</strong>
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            User ID: <strong>{userId || '—'}</strong>
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {!email || !userId ? (
          <Alert severity="warning">
            Email or User ID is missing for this user. Cannot fetch assigned CAP.
          </Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Fetching assigned CAP…
            </Typography>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={fetchAssignedCAP}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : data ? (
          <Box>
            {/* Count & Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
              <Chip
                label={`Total: ${totalCount} | Showing: ${filteredItems.length}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <TextField
                size="small"
                placeholder="Search by content name or identifier"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 280 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {filteredItems.length === 0 ? (
              <Alert severity="info">
                {searchQuery ? 'No courses match your search.' : 'No assigned CAP courses found for this user.'}
              </Alert>
            ) : (
              filteredItems.map((content, idx) => (
                <Accordion
                  key={content.identifier || idx}
                  expanded={expandedAccordion === (content.identifier || String(idx))}
                  onChange={handleAccordionChange(content.identifier || String(idx))}
                  sx={{ mb: 1, '&:before': { display: 'none' } }}
                  variant="outlined"
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
                    }}
                  >
                    <Chip
                      label={`#${idx + 1}`}
                      size="small"
                      color="default"
                      sx={{ fontWeight: 700, minWidth: 40 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                      {content.name || 'Unnamed Course'}
                    </Typography>
                    <Chip
                      label={content.status || 'Unknown'}
                      size="small"
                      color={content.status === 'Live' ? 'success' : 'default'}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderContentCard(content, idx)}
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        {data && !loading && (
          <Button onClick={fetchAssignedCAP} disabled={loading} size="small">
            Refresh
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
