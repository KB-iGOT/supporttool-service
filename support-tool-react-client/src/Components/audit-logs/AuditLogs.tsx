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
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  ExpandMore,
  ExpandLess,
  Search,
  Clear,
  FilterList,
  Download,
} from '@mui/icons-material';
// Remove date picker imports for now - we'll use regular text inputs for dates
import { auditLogService } from '../../services/audit-log.service';
import { AuditLog, AuditLogFilters } from '../../types/audit-logs';
import { JsonEditor } from '../common-components/json-editor/json-editor';
interface AuditLogsProps {
  userId?: string;
}
export const AuditLogs: React.FC<AuditLogsProps> = ({ userId: propUserId }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [modules, setModules] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  // Filter states
  const [filters, setFilters] = useState<AuditLogFilters>({
    module: '',
    subModule: '',
    action: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    entityId: '',
    userId: propUserId || '',
  });

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await auditLogService.getAuditLogs(
        page + 1,
        rowsPerPage,
        filters
      );
      
      // Ensure we have valid data structure
      const logs = Array.isArray(response.data) ? response.data : [];
      const total = typeof response.total === 'number' ? response.total : 0;
      
      setAuditLogs(logs);
      setTotalCount(total);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  // Effect to update filters when propUserId changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      userId: propUserId || ''
    }));
    setPage(0); // Reset to first page when user changes
  }, [propUserId]);

  const fetchFilterOptions = async () => {
    try {
      const [modulesResponse, actionsResponse] = await Promise.all([
        auditLogService.getModules(),
        auditLogService.getActions(),
      ]);
      setModules(modulesResponse.data || []);
      setActions(actionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = async (log: AuditLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  const handleToggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      module: '',
      subModule: '',
      action: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      entityId: '',
      userId: propUserId || '',
    });
    setPage(0);
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchAuditLogs();
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await auditLogService.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return 'success';
      case 'FAILURE':
      case 'ERROR':
        return 'error';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'warning';
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJson = (jsonData: string | object | null | undefined) => {
    if (!jsonData) return 'No data';
    
    try {
      // If it's already an object, stringify it
      if (typeof jsonData === 'object') {
        return JSON.stringify(jsonData, null, 2);
      }
      
      // If it's a string, try to parse and reformat it
      if (typeof jsonData === 'string') {
        const parsed = JSON.parse(jsonData);
        return JSON.stringify(parsed, null, 2);
      }
      
      // Fallback to string conversion
      return String(jsonData);
    } catch (error) {
      console.warn('Error formatting JSON:', error, 'Data:', jsonData);
      // If parsing fails, return as string
      return String(jsonData || 'Invalid JSON data');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: propUserId ? 'none' : 'block' }}>
          Audit Logs
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Filters</Typography>
              <Box>
                <Button
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button
                  startIcon={<Download />}
                  variant="outlined"
                  size="small"
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Box>
            </Box>

            <Collapse in={showFilters}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Module"
                    select
                    value={filters.module}
                    onChange={(e) => handleFilterChange('module', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">All Modules</MenuItem>
                    {modules.map((module) => (
                      <MenuItem key={module} value={module}>
                        {module}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Action"
                    select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">All Actions</MenuItem>
                    {actions.map((action) => (
                      <MenuItem key={action} value={action}>
                        {action}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Sub Module"
                    value={filters.subModule}
                    onChange={(e) => handleFilterChange('subModule', e.target.value)}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Status"
                    select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    size="small"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="SUCCESS">Success</MenuItem>
                    <MenuItem value="FAILURE">Failure</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Entity ID"
                    value={filters.entityId}
                    onChange={(e) => handleFilterChange('entityId', e.target.value)}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="User ID"
                    value={filters.userId}
                    disabled={!!propUserId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Date From"
                    type="datetime-local"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Date To"
                    type="datetime-local"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Search />}
                      onClick={handleApplyFilters}
                      variant="contained"
                      size="small"
                    >
                      Apply
                    </Button>
                    <Button
                      startIcon={<Clear />}
                      onClick={handleClearFilters}
                      variant="outlined"
                      size="small"
                    >
                      Clear
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Collapse>
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
                        <TableCell>Expand</TableCell>
                        <TableCell>Date/Time</TableCell>
                        <TableCell>Module</TableCell>
                        <TableCell>Sub Module</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Entity ID</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.filter(log => log && log.id).map((log) => (
                        <React.Fragment key={log.id}>
                          <TableRow>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleExpand(log.id)}
                              >
                                {expandedRows.has(log.id) ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ minWidth: 180 }}>{formatDate(log.createdAt || '')}</TableCell>
                            <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Tooltip title={log.module || ''}>
                                <span>{log.module || '-'}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Tooltip title={log.subModule || ''}>
                                <span>{log.subModule || '-'}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Tooltip title={log.action || ''}>
                                <span>{log.action || '-'}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.status || 'Unknown'}
                                color={getStatusColor(log.status || '')}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title={log.entityId || ''} >
                                <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                  {log.entityId || '-'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(log)}
                                color="primary"
                              >
                                <Visibility />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={8} sx={{ py: 0 }}>
                              <Collapse in={expandedRows.has(log.id)}>
                                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Request Payload:
                                      </Typography>
                                      <JsonEditor
                                        input={log.requestPayload}
                                        onChange={() => {}}
                                        customOptions={{ readOnly: true, automaticLayout: true }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Modified Payload:
                                      </Typography>
                                      <JsonEditor
                                        input={log.modifiedPayload}
                                        onChange={() => {}}
                                        customOptions={{ readOnly: true, automaticLayout: true }}
                                      />
                                    </Grid>
                                    {log.message && (
                                      <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          Message:
                                        </Typography>
                                        <Paper sx={{ p: 1, bgcolor: 'info.light', color: 'info.contrastText' }}>
                                          <Typography variant="body2">
                                            {log.message}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    )}
                                    {log.jiraLink && (
                                      <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          JIRA Link:
                                        </Typography>
                                        <Button
                                          variant="outlined"
                                          href={log.jiraLink}
                                          target="_blank"
                                          size="small"
                                        >
                                          View JIRA Ticket
                                        </Button>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
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

        {/* Detail Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Audit Log Details
            {selectedLog && (
              <Chip
                label={selectedLog.status}
                color={getStatusColor(selectedLog.status)}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Typography><strong>ID:</strong> {selectedLog.id}</Typography>
                  <Typography><strong>Module:</strong> {selectedLog.module}</Typography>
                  <Typography><strong>Sub Module:</strong> {selectedLog.subModule}</Typography>
                  <Typography><strong>Action:</strong> {selectedLog.action}</Typography>
                  <Typography><strong>Date/Time:</strong> {formatDate(selectedLog.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>User Information</Typography>
                  <Typography><strong>User ID:</strong> {selectedLog.userId}</Typography>
                  <Typography><strong>Entity ID:</strong> {selectedLog.entityId}</Typography>
                  <Typography><strong>IP Address:</strong> {selectedLog.ipAddress}</Typography>
                  <Typography><strong>User Agent:</strong> {selectedLog.userAgent}</Typography>
                  {selectedLog.jiraLink && (
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="contained"
                        href={selectedLog.jiraLink}
                        target="_blank"
                        size="small"
                      >
                        View JIRA Ticket
                      </Button>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Request Payload</Typography>
                  <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.100' }}>
                    <pre style={{ margin: 0, fontSize: '0.9rem' }}>
                      {formatJson(selectedLog.requestPayload)}
                    </pre>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Modified Payload</Typography>
                  <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.100' }}>
                    <pre style={{ margin: 0, fontSize: '0.9rem' }}>
                      {formatJson(selectedLog.modifiedPayload)}
                    </pre>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Response Payload</Typography>
                  <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.100' }}>
                    <pre style={{ margin: 0, fontSize: '0.9rem' }}>
                      {formatJson(selectedLog.responsePayload)}
                    </pre>
                  </Paper>
                </Grid>
                {selectedLog.message && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Message</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                      <Typography>{selectedLog.message}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};
