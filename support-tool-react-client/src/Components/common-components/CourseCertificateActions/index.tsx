import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Button,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ReplayIcon from '@mui/icons-material/Replay';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { usersService } from '../../../services/users.service';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';

// ------- Types -------

export interface IssuedCertificate {
  identifier: string;
  name: string;
  token: string;
  lastIssuedOn: string;
}

export interface CourseCertificateActionsProps {
  /** Enrolled user's ID */
  userId: string;
  /** Course/Content identifier (courseId in enrollment) */
  courseId: string;
  /** Batch ID for this enrollment */
  batchId: string;
  /** Human-readable course name (for dialog display) */
  courseName: string;
  /** Enrollment status: 0 = not started, 1 = in-progress, 2 = completed */
  enrollStatus?: number;
  /** Certificates already issued for this enrollment */
  issuedCertificates?: IssuedCertificate[];
  /** Completion epoch timestamp */
  completedOn?: number;
  /** Module name passed to audit interceptor */
  moduleName?: string;
  /** Show as icon buttons only (compact mode) */
  compact?: boolean;
}

const formatDate = (ts: number | string | undefined) => {
  if (!ts) return 'N/A';
  try {
    return new Date(typeof ts === 'number' ? ts : ts).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(ts);
  }
};

// ------- Main Component -------

export const CourseCertificateActions: React.FC<CourseCertificateActionsProps> = ({
  userId,
  courseId,
  batchId,
  courseName,
  enrollStatus,
  issuedCertificates = [],
  completedOn,
  moduleName = 'users',
  compact = false,
}) => {
  const isCompleted = enrollStatus === 2;

  // ---- Reissue state ----
  const [reissueOpen, setReissueOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reissueSuccess, setReissueSuccess] = useState(false);
  const [reissueError, setReissueError] = useState<string | null>(null);

  // ---- Certificate view state ----
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certPickerOpen, setCertPickerOpen] = useState(false);
  const [certData, setCertData] = useState<string | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);

  // ---- Download menu state ----
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);
  const isDownloadMenuOpen = Boolean(downloadAnchorEl);

  // ---- Action interceptor for reissue (adds Jira tracking) ----
  const { handleAction: triggerReissueAction } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (ticket: any) => performReissue(ticket),
    getPayload: () => ({}),
  });

  // ---- Handlers ----

  const openReissue = () => {
    setReissueOpen(true);
    setReissueSuccess(false);
    setReissueError(null);
  };

  const closeReissue = () => {
    setReissueOpen(false);
  };

  const performReissue = async (ticket: any) => {
    try {
      setProcessing(true);
      const request = {
        payload: {
          request: {
            userIds: [userId],
            courseId,
            batchId,
            type: 'course',
          },
        },
        changedFields: 'Reissued Certificate',
        module: moduleName,
        jiraLink: ticket?.jiraLink || '',
        userId,
      };
      const response = await usersService.reissuecertificate(request);
      if (
        response?.result?.result?.result?.status ||
        response?.responseCode === 'OK'
      ) {
        setReissueSuccess(true);
      } else {
        setReissueError('Reissue request submitted. Certificate will be regenerated shortly.');
        setReissueSuccess(true);
      }
    } catch (err: any) {
      setReissueError(err?.response?.data?.message || err?.message || 'Failed to reissue certificate');
    } finally {
      setProcessing(false);
    }
  };

  const openCertPicker = () => {
    if (issuedCertificates.length === 1) {
      fetchAndViewCert(issuedCertificates[0].identifier);
    } else {
      setCertPickerOpen(true);
    }
  };

  const fetchAndViewCert = async (certId: string) => {
    setSelectedCertId(certId);
    setCertDialogOpen(true);
    setCertPickerOpen(false);
    setCertData(null);
    setCertError(null);
    setLoadingCert(true);
    try {
      const response = await usersService.downloadcertificate(certId);
      if (response?.result?.printUri) {
        setCertData(response.result.printUri);
      } else {
        throw new Error('No certificate data returned');
      }
    } catch (err: any) {
      setCertError(err?.message || 'Failed to load certificate');
    } finally {
      setLoadingCert(false);
    }
  };

  const closeCertDialog = () => {
    setCertDialogOpen(false);
    setCertData(null);
    setSelectedCertId(null);
  };

  // Download helpers
  const downloadAs = (format: 'svg' | 'png' | 'pdf') => {
    if (!certData) return;
    setDownloadAnchorEl(null);

    if (format === 'svg') {
      const link = document.createElement('a');
      link.href = certData;
      link.download = `certificate-${selectedCertId}.svg`;
      link.click();
      return;
    }

    let svgContent: string;
    if (certData.startsWith('data:image/svg+xml,')) {
      svgContent = decodeURIComponent(certData.replace('data:image/svg+xml,', ''));
    } else if (certData.startsWith('data:image/svg+xml;base64,')) {
      svgContent = atob(certData.replace('data:image/svg+xml;base64,', ''));
    } else {
      svgContent = decodeURIComponent(certData.split(',')[1] || '');
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgContent;
    const svgEl = tempDiv.querySelector('svg');
    if (!svgEl) return;

    if (!svgEl.hasAttribute('width')) svgEl.setAttribute('width', '1000');
    if (!svgEl.hasAttribute('height')) svgEl.setAttribute('height', '700');

    const canvas = document.createElement('canvas');
    canvas.width = parseInt(svgEl.getAttribute('width') || '1000');
    canvas.height = parseInt(svgEl.getAttribute('height') || '700');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      if (format === 'png' || format === 'pdf') {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `certificate-${selectedCertId}.${format === 'pdf' ? 'png' : 'png'}`;
        link.click();
      }
    };
    img.src = url;
  };

  // ---- Render ----

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {/* View Certificate */}
        {issuedCertificates.length > 0 && (
          <Tooltip title={`View ${issuedCertificates.length > 1 ? `${issuedCertificates.length} certificates` : 'certificate'}`}>
            <Badge badgeContent={issuedCertificates.length > 1 ? issuedCertificates.length : 0} color="primary">
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<WorkspacePremiumIcon fontSize="small" />}
                onClick={openCertPicker}
              >
                {compact ? 'View' : 'View Certificate'}
              </Button>
            </Badge>
          </Tooltip>
        )}

        {/* Re-issue Certificate */}
        {isCompleted && (
          <Tooltip title="Re-issue certificate for this course">
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<ReplayIcon fontSize="small" />}
              onClick={openReissue}
            >
              {compact ? 'Re-issue' : 'Re-issue Certificate'}
            </Button>
          </Tooltip>
        )}
      </Box>

      {/* ---- Certificate Picker Dialog (multiple certs) ---- */}
      <Dialog open={certPickerOpen} onClose={() => setCertPickerOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Select Certificate to View</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {courseName} — {issuedCertificates.length} certificates issued
          </Typography>
          {issuedCertificates.map((cert, i) => (
            <Box
              key={cert.identifier}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{cert.name || `Certificate ${i + 1}`}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Issued: {formatDate(cert.lastIssuedOn)}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={() => fetchAndViewCert(cert.identifier)}>
                View
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertPickerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Certificate View Dialog ---- */}
      <Dialog open={certDialogOpen} onClose={closeCertDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Certificate Preview</Typography>
            {certData && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={(e) => setDownloadAnchorEl(e.currentTarget)}
                  aria-haspopup="true"
                >
                  Download
                </Button>
                <Menu
                  anchorEl={downloadAnchorEl}
                  open={isDownloadMenuOpen}
                  onClose={() => setDownloadAnchorEl(null)}
                >
                  <MenuItem onClick={() => downloadAs('svg')}>
                    <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>SVG (Vector)</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => downloadAs('png')}>
                    <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>PNG Image</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => downloadAs('pdf')}>
                    <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>PDF Document</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingCert ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : certError ? (
            <Alert severity="error">{certError}</Alert>
          ) : certData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <img
                src={certData}
                alt="Certificate"
                style={{ maxWidth: '100%', height: 'auto' }}
                onError={() => setCertError('Failed to render certificate image')}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCertDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Reissue Dialog ---- */}
      <Dialog open={reissueOpen} onClose={closeReissue} maxWidth="sm" fullWidth>
        <DialogTitle>Re-issue Certificate</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to re-issue a certificate for:
          </Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {courseName}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2"><strong>Course ID:</strong> {courseId}</Typography>
            <Typography variant="body2"><strong>Batch ID:</strong> {batchId}</Typography>
            {completedOn && (
              <Typography variant="body2"><strong>Completed On:</strong> {formatDate(completedOn)}</Typography>
            )}
            <Typography variant="body2">
              <strong>Certificates Issued:</strong> {issuedCertificates.length}
            </Typography>
          </Box>
          {reissueSuccess ? (
            <Alert severity="success">
              Certificate re-issue request for Batch ID <strong>{batchId}</strong> submitted successfully!
            </Alert>
          ) : reissueError ? (
            <Alert severity={reissueSuccess ? 'success' : 'warning'}>{reissueError}</Alert>
          ) : (
            <Alert severity="info">
              Re-issuing will generate a new certificate for this completed course.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReissue} disabled={processing}>
            {reissueSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!reissueSuccess && (
            <Button
              onClick={triggerReissueAction}
              variant="contained"
              color="primary"
              disabled={processing}
              startIcon={processing ? <CircularProgress size={18} /> : <ReplayIcon />}
            >
              {processing ? 'Processing…' : 'Re-issue Certificate'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
