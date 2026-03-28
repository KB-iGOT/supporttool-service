import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  IconButton,
  Box,
  Typography,
  Chip,
  Button,
  Collapse,
  Grid,
  Tooltip,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ContentEnrollment, ContentTableProps } from '../types';

interface CollapsibleRowProps {
  enrollment: ContentEnrollment;
  formatDate: (timestamp: number) => string;
  getStatusLabel: (status: number) => string;
  handleOpenReissueDialog: (enrollment: ContentEnrollment) => void;
  handleOpenCertificateDialog: (certId: string) => void;
  handleOpenContentDetailsDialog: (enrollment: ContentEnrollment) => void;
  canWrite?: boolean;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({
  enrollment,
  formatDate,
  getStatusLabel,
  handleOpenReissueDialog,
  handleOpenCertificateDialog,
  handleOpenContentDetailsDialog,
  canWrite = true
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center">
            {enrollment.courseLogoUrl && (
              <Box
                component="img"
                src={enrollment.content.posterImage || enrollment?.content?.appIcon}
                alt=""
                sx={{ width: 40, height: 40, mr: 2, borderRadius: 1 }}
              />
            )}
            <Typography variant="body2">{enrollment?.courseName}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(enrollment.status)}
            color={enrollment.status === 2 ? "success" : "warning"}
            size="small"
          />
        </TableCell>
        <TableCell>{`${enrollment.completionPercentage}%`}</TableCell>
        <TableCell>{enrollment.completedOn ? formatDate(enrollment.completedOn) : 'N/A'}</TableCell>
        <TableCell>
          {enrollment.issuedCertificates && enrollment.issuedCertificates.length > 0 ? (
            <Chip
              label={`${enrollment.issuedCertificates.length} Issued`}
              color="primary"
              size="small"
              icon={<SchoolIcon />}
            />
          ) : (
            <Chip label="None" variant="outlined" size="small" />
          )}
        </TableCell>
        <TableCell>
          {enrollment.issuedCertificates && enrollment.issuedCertificates.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="info"
                onClick={() => handleOpenCertificateDialog(enrollment.issuedCertificates[0].identifier)}
              >
                View Certificate
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleOpenReissueDialog(enrollment)}
                disabled={enrollment.status !== 2 || !canWrite}
              >
                Re-issue
              </Button>
              <Tooltip title="View Full Details">
                <IconButton
                  color="secondary"
                  onClick={() => handleOpenContentDetailsDialog(enrollment)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleOpenReissueDialog(enrollment)}
                disabled={enrollment.status !== 2 || !canWrite}
              >
                Re-issue
              </Button>
              <Tooltip title="View Full Details">
                <IconButton
                  color="secondary"
                  onClick={() => handleOpenContentDetailsDialog(enrollment)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Additional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Course ID:</strong> {enrollment.courseId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Batch ID:</strong> {enrollment.batchId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Completion Date:</strong> {formatDate(enrollment.completedOn)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Certificates Issued:</strong> {enrollment.issuedCertificates?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Added By:</strong> {enrollment?.addedBy || enrollment?.content?.contentPartner?.contentPartnerName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Active:</strong> {enrollment.active ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};


export const ContentTable: React.FC<ContentTableProps> = ({
  contentEnrollments,
  filteredContent,
  contentPage,
  contentRowsPerPage,
  error,
  formatDate,
  getStatusLabel,
  handleOpenReissueDialog,
  handleOpenCertificateDialog,
  handleContentPageChange,
  handleContentRowsPerPageChange,
  handleOpenContentDetailsDialog,
  canWrite = true
}) => {
  if (contentEnrollments.length === 0) {
    return (
      <Alert severity="info">
        {error ? "Failed to load course enrollments. Please try again later." : "No course enrollments found for this user."}
      </Alert>
    );
  }

  if (filteredContent.length === 0) {
    return (
      <Alert severity="info">No courses match your search criteria.</Alert>
    );
  }

  return (
    <>
      <TableContainer>
        <Table aria-label="collapsible course enrollments table">
        <TableHead >
            <TableRow>
              <TableCell />
              <TableCell >Course Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Completion Date</TableCell>
              <TableCell>Certificates</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        <TableBody>
            {filteredContent
              .slice(contentPage * contentRowsPerPage, contentPage * contentRowsPerPage + contentRowsPerPage)
              .map((enrollment, index) => (
                <CollapsibleRow 
                  key={enrollment.courseId + index} 
                  enrollment={enrollment} 
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}                  
                  handleOpenReissueDialog={handleOpenReissueDialog}
                  handleOpenCertificateDialog={handleOpenCertificateDialog}
                  handleOpenContentDetailsDialog={handleOpenContentDetailsDialog}
                  canWrite={canWrite}
                />
              ))}
          </TableBody>
        </Table>
      </TableContainer >
      <TablePagination

        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredContent.length}
        rowsPerPage={contentRowsPerPage}
        page={contentPage}
        onPageChange={handleContentPageChange}
        onRowsPerPageChange={handleContentRowsPerPageChange}
      />
    </>    
  );
};