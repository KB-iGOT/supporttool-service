import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import { contentsService } from '../../services/contents.service';
import { useActionInterceptor } from '../../hooks/useActionInterceptor';

interface Batch {
  batchId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  enrollmentType?: string;
  status?: string | number;
  participants?: number;
  mentors?: string[];
  createdBy?: string;
  createdOn?: string;
  updatedOn?: string;
  [key: string]: any;
}

interface ContentDetails {
  identifier: string;
  name: string;
  description?: string;
  batches?: Batch[];
  [key: string]: any;
}

export const BatchDetails: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const contentFromState = location.state?.content;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatches, setActiveBatches] = useState<Batch[]>([]);
  const [archivedBatches, setArchivedBatches] = useState<Batch[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (contentId) {
      fetchContentAndBatches();
    }
  }, [contentId]);

  const fetchContentAndBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contentsService.getContentDetails(contentId!);
      debugger
      if (response?.result?.result?.content) {
        const content = response.result.result.content;
        setContentDetails(content);
        
        // Extract batches from the response
        // The API structure might vary, adjust accordingly
        const batchesData = content.batches || content.batch || [];
        const allBatches = Array.isArray(batchesData) ? batchesData : [];
        setBatches(allBatches);
        
        // Segregate batches based on endDate
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        
        const active: Batch[] = [];
        const archived: Batch[] = [];
        
        allBatches.forEach((batch) => {
          if (batch.endDate) {
            const endDate = new Date(batch.endDate);
            endDate.setHours(0, 0, 0, 0);
            
            if (endDate < today) {
              archived.push(batch);
            } else {
              active.push(batch);
            }
          } else {
            // If no endDate, treat as active
            active.push(batch);
          }
        });
        
        setActiveBatches(active);
        setArchivedBatches(archived);
      } else {
        setError('No content details found');
      }
    } catch (err: any) {
      console.error('Error fetching content and batches:', err);
      setError(err?.response?.data?.message || 'Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/contents');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBatchStatus = (startDate?: string, endDate?: string): { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!startDate) {
      return { label: 'Unknown', color: 'default' };
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // Not Started: today < startDate
    if (today < start) {
      return { label: 'Not Started', color: 'info' };
    }

    // If we have an endDate
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      // Completed: today > endDate
      if (today > end) {
        return { label: 'Completed', color: 'default' };
      }

      // Live: startDate <= today <= endDate
      if (today >= start && today <= end) {
        return { label: 'Live', color: 'success' };
      }
    }

    // Default to Live if started but no end date or within range
    return { label: 'Live', color: 'success' };
  };

  const handleEditClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setNewEndDate(batch.endDate || '');
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedBatch(null);
    setNewEndDate('');
  };

  const handleUpdateBatch = async (auditData: any) => {
    if (!selectedBatch || !newEndDate) return;

    setUpdating(true);
    try {
      const payload = {
        request: {
          id: selectedBatch.batchId,
          name: selectedBatch.name,
          description: selectedBatch.description,
          courseId: contentId,
          startDate: selectedBatch.startDate,
          endDate: newEndDate,
          status: selectedBatch.status ?? 1,
          enrollmentType: selectedBatch.enrollmentType,
          ...(selectedBatch.mentors && { mentors: selectedBatch.mentors }),
          ...(selectedBatch.createdBy && { createdBy: selectedBatch.createdBy }),
          ...(selectedBatch.batchAttributes && { batchAttributes: selectedBatch.batchAttributes }),
        },
        ...auditData
      };

      await contentsService.updateBatch(payload);
      setSuccessMessage('Batch updated successfully!');
      handleEditClose();
      
      // Refresh batch data
      fetchContentAndBatches();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating batch:', err);
      setError(err?.response?.data?.message || 'Failed to update batch');
    } finally {
      setUpdating(false);
    }
  };

  const { handleAction: handleUpdateAction } = useActionInterceptor({
    actionType: 'UPDATE_BATCH',
    onComplete: handleUpdateBatch,
    getPayload: () => ({
      batchId: selectedBatch?.batchId,
      courseId: contentId,
      endDate: newEndDate
    }),
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Contents
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={handleBack} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <div>
            <Typography variant="h4" component="h1">
              Batch Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {contentFromState?.name || contentDetails?.name || 'Course'}
            </Typography>
          </div>
        </Box>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Content Info Card */}
      {contentDetails && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Course Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Identifier
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {contentDetails.identifier}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Primary Category
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {contentDetails.primaryCategory || 'Course'}
              </Typography>
            </Grid>
            {contentDetails.description && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {contentDetails.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Batches Section */}
      {batches.length === 0 ? (
        <Alert severity="info" icon={<InfoIcon />}>
          No batches found for this course.
        </Alert>
      ) : (
        <>
          {/* Active/Ongoing Batches Section */}
          {activeBatches.length > 0 && (
            <Box mb={4}>
              <Box mb={2} display="flex" alignItems="center" gap={2}>
                <Typography variant="h5">
                  Ongoing / Upcoming Batches
                </Typography>
                <Chip label={activeBatches.length} color="primary" size="small" />
              </Box>
              <Grid container spacing={3}>
                {activeBatches.map((batch, index) => (
                  <Grid item xs={12} md={6} lg={4} key={batch.batchId || index}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s',
                        '&:hover': {
                          elevation: 6,
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Batch Name & Status */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Typography variant="h6" component="h3" sx={{ flexGrow: 1, pr: 1 }}>
                            {batch.name || `Batch ${index + 1}`}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {(() => {
                              const status = getBatchStatus(batch.startDate, batch.endDate);
                              return (
                                <Chip 
                                  label={status.label} 
                                  color={status.color}
                                  size="small"
                                />
                              );
                            })()}
                            {batch.endDate && (
                              <Tooltip title="Edit End Date">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(batch)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>

                        {/* Batch ID */}
                        {batch.batchId && (
                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary">
                              Batch ID
                            </Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {batch.batchId}
                            </Typography>
                          </Box>
                        )}

                        {/* Description */}
                        {batch.description && (
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {batch.description}
                          </Typography>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Batch Details */}
                        <Box display="flex" flexDirection="column" gap={1.5}>
                          {/* Date Range */}
                          {(batch.startDate || batch.endDate) && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarTodayIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Duration
                                </Typography>
                                <Typography variant="body2">
                                  {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Participants */}
                          {batch.participants !== undefined && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PeopleIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Participants
                                </Typography>
                                <Typography variant="body2">
                                  {batch.participants} enrolled
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Enrollment Type */}
                          {batch.enrollmentType && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <SchoolIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Enrollment
                                </Typography>
                                <Typography variant="body2">
                                  {batch.enrollmentType}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Mentors */}
                          {batch.mentors && batch.mentors.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                Mentors
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {batch.mentors.map((mentor, idx) => (
                                  <Chip key={idx} label={mentor} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Created/Updated Info */}
                          {(batch.createdOn || batch.updatedOn) && (
                            <Box mt={1} pt={1} borderTop="1px solid" borderColor="divider">
                              {batch.createdBy && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Created by: {batch.createdBy}
                                </Typography>
                              )}
                              {batch.createdOn && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Created: {formatDate(batch.createdOn)}
                                </Typography>
                              )}
                              {batch.updatedOn && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Updated: {formatDate(batch.updatedOn)}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Archived Batches Section */}
          {archivedBatches.length > 0 && (
            <Box>
              <Box mb={2} display="flex" alignItems="center" gap={2}>
                <Typography variant="h5">
                  Archived Batches
                </Typography>
                <Chip label={archivedBatches.length} color="default" size="small" />
              </Box>
              <Grid container spacing={3}>
                {archivedBatches.map((batch, index) => (
                  <Grid item xs={12} md={6} lg={4} key={batch.batchId || index}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s',
                        opacity: 0.85,
                        '&:hover': {
                          elevation: 6,
                          transform: 'translateY(-4px)',
                          opacity: 1
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Batch Name & Status */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Typography variant="h6" component="h3" sx={{ flexGrow: 1, pr: 1 }}>
                            {batch.name || `Batch ${index + 1}`}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip label="Archived" color="default" size="small" />
                            {(() => {
                              const status = getBatchStatus(batch.startDate, batch.endDate);
                              return (
                                <Chip 
                                  label={status.label} 
                                  color={status.color}
                                  size="small"
                                />
                              );
                            })()}
                          </Box>
                        </Box>

                        {/* Batch ID */}
                        {batch.batchId && (
                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary">
                              Batch ID
                            </Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {batch.batchId}
                            </Typography>
                          </Box>
                        )}

                        {/* Description */}
                        {batch.description && (
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {batch.description}
                          </Typography>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Batch Details */}
                        <Box display="flex" flexDirection="column" gap={1.5}>
                          {/* Date Range */}
                          {(batch.startDate || batch.endDate) && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarTodayIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Duration
                                </Typography>
                                <Typography variant="body2">
                                  {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Participants */}
                          {batch.participants !== undefined && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PeopleIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Participants
                                </Typography>
                                <Typography variant="body2">
                                  {batch.participants} enrolled
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Enrollment Type */}
                          {batch.enrollmentType && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <SchoolIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Enrollment
                                </Typography>
                                <Typography variant="body2">
                                  {batch.enrollmentType}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Mentors */}
                          {batch.mentors && batch.mentors.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                Mentors
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {batch.mentors.map((mentor, idx) => (
                                  <Chip key={idx} label={mentor} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Created/Updated Info */}
                          {(batch.createdOn || batch.updatedOn) && (
                            <Box mt={1} pt={1} borderTop="1px solid" borderColor="divider">
                              {batch.createdBy && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Created by: {batch.createdBy}
                                </Typography>
                              )}
                              {batch.createdOn && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Created: {formatDate(batch.createdOn)}
                                </Typography>
                              )}
                              {batch.updatedOn && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Updated: {formatDate(batch.updatedOn)}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Edit Batch Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Batch End Date</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Batch: {selectedBatch?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom mb={2}>
              Batch ID: {selectedBatch?.batchId}
            </Typography>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: selectedBatch?.startDate,
              }}
              helperText={selectedBatch?.startDate ? `Start Date: ${formatDate(selectedBatch.startDate)}` : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateAction}
            variant="contained"
            disabled={updating || !newEndDate || newEndDate === selectedBatch?.endDate}
          >
            {updating ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
