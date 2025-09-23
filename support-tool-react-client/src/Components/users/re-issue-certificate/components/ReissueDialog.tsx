import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { ContentEnrollment, EventEnrollment, ReissueDialogProps } from '../types';

export const ReissueDialog: React.FC<ReissueDialogProps> = ({
  open,
  selectedEnrollment,
  processingReissue,
  reissueSuccess,
  reissueError,
  formatDate,
  onClose,
  onReissue
}) => {
  // Helper function to get the name from either content or event enrollment
  const getEnrollmentName = (enrollment: ContentEnrollment | EventEnrollment) => {
    if ('courseName' in enrollment) {
      return enrollment.courseName;
    }
    return enrollment.name;
  };

  // Helper function to get the ID from either content or event enrollment
  const getEnrollmentId = (enrollment: ContentEnrollment | EventEnrollment) => {
    if ('courseId' in enrollment) {
      return enrollment.courseId;
    }
    return enrollment.contentId || enrollment.identifier;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Re-issue Certificate</DialogTitle>
      <DialogContent>
        {selectedEnrollment && (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              You are about to re-issue a certificate for:
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {getEnrollmentName(selectedEnrollment)}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>ID:</strong> {getEnrollmentId(selectedEnrollment)}
              </Typography>
              <Typography variant="body2">
                <strong>Batch ID:</strong> {selectedEnrollment.batchId}
              </Typography>
              <Typography variant="body2">
                <strong>Completion Date:</strong> {selectedEnrollment.completedOn ? formatDate(selectedEnrollment.completedOn) : 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Certificates Issued:</strong> {selectedEnrollment.issuedCertificates?.length || 0}
              </Typography>
            </Box>
            
            {reissueSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Certificates issue action for Course Batch Id {selectedEnrollment.batchId} submitted Successfully!
              </Alert>
            ) : reissueError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {reissueError}
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Re-issuing a certificate will generate a new certificate for this course completion.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processingReissue}>
          {reissueSuccess ? 'Close' : 'Cancel'}
        </Button>
        {!reissueSuccess && (
          <Button
            onClick={onReissue}
            variant="contained"
            color="primary"
            disabled={processingReissue}
            startIcon={processingReissue ? <CircularProgress size={24} /> : <DownloadIcon />}
          >
            {processingReissue ? 'Processing...' : 'Re-issue Certificate'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};