import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  Grid,
  Button,
  CircularProgress,
  MenuItem,
  Alert,
  Menu,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Search,
  Clear,
  Add as AddIcon,
  MoreVert,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { topicsService } from '../../services/topics.service';
import { CreateTopicDialog } from './CreateTopicDialog';
import EditTopicDialog from './EditTopicDialog';
import { useActionIntercept } from '../../Context/AppContext';

interface Topic {
  categoryId: number;
  categoryName: string;
  description: string;
  parentId: number;
  createdAt: string;
  lastUpdatedAt: string;
  departmentId: string;
  countOfCommunities: number;
  status: string;
}

export const Topics: React.FC = () => {
  const { interceptAction } = useActionIntercept();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Dialog states
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setCreating] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Actions menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const filterCriteriaMap: any = {};
      
      // Add status filter
      if (statusFilter) {
        filterCriteriaMap.status = statusFilter;
      }
      
      // Add search filter (assuming the API supports categoryName search)
      if (searchText.trim()) {
        filterCriteriaMap.categoryName = searchText.trim();
      }

      const response = await topicsService.getTopics(
        page,
        rowsPerPage,
        filterCriteriaMap
      );
      
      // Extract data from the response structure
      const result = response?.result?.search_results;
      const topicsData = Array.isArray(result?.data) ? result.data : [];
      const total = typeof result?.totalCount === 'number' ? result.totalCount : 0;
      
      setTopics(topicsData);
      setTotalCount(total);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchText, statusFilter]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchTopics();
  };

  const handleClearSearch = () => {
    setSearchText('');
    setStatusFilter('active');
    setPage(0);
  };

  const handleCreateTopic = async (categoryName: string, description: string) => {
    const actionPayload = {
      requestPayload: { categoryName, description },
      count: 1,
    };

    interceptAction('TOPICS', actionPayload, async (auditData: any) => {
      setCreating(true);
      try {
        await topicsService.createTopic(auditData);
        setNotification({
          open: true,
          message: 'Topic created successfully!',
          severity: 'success',
        });
        setCreateDialogOpen(false);
        setPage(0);
        fetchTopics(); // Refresh the list
      } catch (error: any) {
        console.error('Error creating topic:', error);
        setNotification({
          open: true,
          message: error.response?.data?.responseMessage || 'Failed to create topic. Please try again.',
          severity: 'error',
        });
      } finally {
        setCreating(false);
      }
    });
  };

  // Actions menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, topic: Topic) => {
    setAnchorEl(event.currentTarget);
    setSelectedTopic(topic);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateTopic = async (updatedTopic: any) => {
    if (!selectedTopic) return;

    // Calculate modifiedPayload by comparing original and updated values
    const modifiedPayload: any = {};
    
    if (selectedTopic.categoryName !== updatedTopic.categoryName) {
      modifiedPayload.categoryName = {
        original: selectedTopic.categoryName,
        new: updatedTopic.categoryName,
      };
    }
    
    if (selectedTopic.description !== updatedTopic.description) {
      modifiedPayload.description = {
        original: selectedTopic.description,
        new: updatedTopic.description,
      };
    }

    const actionPayload = {
      requestPayload: {
        categoryId: updatedTopic.categoryId,
        categoryName: updatedTopic.categoryName,
        description: updatedTopic.description,
      },
      modifiedPayload,
      count: 1,
    };

    interceptAction('TOPICS', actionPayload, async (auditData: any) => {
      setUpdating(true);
      try {
        await topicsService.updateTopic(auditData);
        setNotification({
          open: true,
          message: 'Topic updated successfully!',
          severity: 'success',
        });
        setEditDialogOpen(false);
        setSelectedTopic(null);
        fetchTopics(); // Refresh the list
      } catch (error: any) {
        console.error('Error updating topic:', error);
        setNotification({
          open: true,
          message: error.response?.data?.responseMessage || 'Failed to update topic. Please try again.',
          severity: 'error',
        });
      } finally {
        setUpdating(false);
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTopic) return;

    const actionPayload = {
      requestPayload: {
        categoryId: selectedTopic.categoryId,
      },
      count: 1,
    };

    interceptAction('TOPICS', actionPayload, async (auditData: any) => {
      setDeleting(true);
      try {
        await topicsService.deleteTopic(auditData);
        setNotification({
          open: true,
          message: 'Topic deleted successfully!',
          severity: 'success',
        });
        setDeleteDialogOpen(false);
        setSelectedTopic(null);
        fetchTopics(); // Refresh the list
      } catch (error: any) {
        console.error('Error deleting topic:', error);
        setNotification({
          open: true,
          message: error.response?.data?.responseMessage || 'Failed to delete topic. Please try again.',
          severity: 'error',
        });
      } finally {
        setDeleting(false);
      }
    });
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'draft':
        return 'warning';
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Topics
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Topic
        </Button>
      </Box>

      {notification.open && (
        <Alert 
          severity={notification.severity} 
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ mb: 3 }}
        >
          {notification.message}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search & Filters
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search by Topic Name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                size="small"
                placeholder="Enter topic name..."
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Status"
                select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<Search />}
                  onClick={handleSearch}
                  variant="contained"
                  size="medium"
                  fullWidth
                >
                  Search
                </Button>
                <Button
                  startIcon={<Clear />}
                  onClick={handleClearSearch}
                  variant="outlined"
                  size="medium"
                  fullWidth
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category ID</TableCell>
                      <TableCell>Topic Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Department ID</TableCell>
                      <TableCell>Communities</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No topics found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      topics.map((topic) => (
                        <TableRow key={topic.categoryId} hover>
                          <TableCell>{topic.categoryId}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {topic.categoryName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                              {topic.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {topic.departmentId || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={topic.countOfCommunities}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={topic.status}
                              color={getStatusColor(topic.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            {formatDate(topic.createdAt)}
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            {formatDate(topic.lastUpdatedAt)}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, topic)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CreateTopicDialog
        open={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateTopic}
        processing={isCreating}
      />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        {selectedTopic && (!selectedTopic.countOfCommunities || selectedTopic.countOfCommunities <= 0) && (
          <MenuItem onClick={handleDeleteClick}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Edit Topic Dialog */}
      <EditTopicDialog
        open={isEditDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTopic(null);
        }}
        onSubmit={handleUpdateTopic}
        topic={selectedTopic}
        loading={isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the topic "{selectedTopic?.categoryName}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
