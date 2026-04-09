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
  Link
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import { EventEnrollment, EventsTableProps } from '../types';

interface CollapsibleEventRowProps {
  event: EventEnrollment;
  formatDate: (timestamp: number) => string;
  getStatusLabel: (status: number) => string;
  handleOpenReissueDialog: (event: EventEnrollment) => void;
  handleOpenCertificateDialog: (certId: string) => void;
  canWrite?: boolean;
}

const CollapsibleEventRow: React.FC<CollapsibleEventRowProps> = ({
  event,
  formatDate,
  getStatusLabel,
  handleOpenReissueDialog,
  handleOpenCertificateDialog,
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
            {event.event?.appIcon && (
              <Box
                component="img"
                src={event.event.appIcon}
                alt=""
                sx={{ width: 40, height: 40, mr: 2, borderRadius: 1 }}
              />
            )}
            <Typography variant="body2">{event.name}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(event.status || 0)}
            color={event.status === 2 ? "success" : "default"}
            size="small"
          />
        </TableCell>
        <TableCell>{event.event?.eventType || 'N/A'}</TableCell>
        <TableCell>{event.event?.startDateTime ? new Date(event.event.startDateTime).toLocaleString() : event.startDate}</TableCell>
        <TableCell>
          {event.issuedCertificates && event.issuedCertificates.length > 0 ? (
            <Chip
              label={`${event.issuedCertificates.length} Issued`}
              color="primary"
              size="small"
              icon={<SchoolIcon />}
            />
          ) : (
            <Chip label="None" variant="outlined" size="small" />
          )}
        </TableCell>
        <TableCell>
          {event.issuedCertificates && event.issuedCertificates.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="info"
                onClick={() => event.issuedCertificates && event.issuedCertificates.length > 0 && 
                  handleOpenCertificateDialog(event.issuedCertificates[0].identifier)}
              >
                View Certificate
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                disabled={event.status !== 2 && !event?.completedOn || !canWrite}
                onClick={() => handleOpenReissueDialog(event)}
              >
                Re-issue
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              disabled={event.status !== 2 && !event?.completedOn || !canWrite}
              onClick={() => handleOpenReissueDialog(event)}
            >
              Re-issue
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Event Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Event ID:</strong> {event.contentId || event.event?.identifier}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Batch ID:</strong> {event.batchId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Start Date:</strong> {event.event?.startDateTime ? new Date(event.event.startDateTime).toLocaleString() : event.startDate}
                  </Typography>
                  <Typography variant="body2">
                    <strong>End Date:</strong> {event.event?.endDateTime ? new Date(event.event.endDateTime).toLocaleString() : event.endDate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Certificates Issued:</strong> {event.issuedCertificates?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Event Type:</strong> {event.event?.eventType || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {getStatusLabel(event.status || 0)}
                  </Typography>
                  {event.event?.registrationLink && (
                    <Typography variant="body2">
                      <strong>Registration Link:</strong>{' '}
                      <Link href={event.event.registrationLink} target="_blank" rel="noopener">
                        Open Link
                      </Link>
                    </Typography>
                  )}
                </Grid>
              </Grid>
              {event.event?.description && (
                <Box mt={2}>
                  <Typography variant="body2">
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    {event.event.description}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};


export const EventsTable: React.FC<EventsTableProps> = ({
  eventEnrollments,
  filteredEvents,
  eventPage,
  eventRowsPerPage,
  error,
  formatDate,
  getStatusLabel,
  handleOpenReissueDialog,
  handleOpenCertificateDialog,
  handleEventPageChange,
  handleEventRowsPerPageChange,
  canWrite = true
}) => {
  if (eventEnrollments.length === 0) {
    return (
      <Alert severity="info">
        {error ? "Failed to load event enrollments. Please try again later." : "No event enrollments found for this user."}
      </Alert>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <Alert severity="info">No events match your search criteria.</Alert>
    );
  }

  return (
    <>
      <TableContainer>
        <Table aria-label="collapsible event enrollments table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Event Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Certificates</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents
              .slice(eventPage * eventRowsPerPage, eventPage * eventRowsPerPage + eventRowsPerPage)
              .map((event, index) => (
                <CollapsibleEventRow
                  key={`${event.identifier}-${index}`}
                  event={event}
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}
                  handleOpenReissueDialog={handleOpenReissueDialog}
                  handleOpenCertificateDialog={handleOpenCertificateDialog}
                  canWrite={canWrite}
                />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredEvents.length}
        rowsPerPage={eventRowsPerPage}
        page={eventPage}
        onPageChange={handleEventPageChange}
        onRowsPerPageChange={handleEventRowsPerPageChange}
      />
    </>
  );
};