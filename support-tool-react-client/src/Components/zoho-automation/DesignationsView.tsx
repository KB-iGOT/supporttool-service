import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    InputAdornment,
    CircularProgress,
    Chip,
    Alert,
    Button,
    Select,
    MenuItem,
    FormControl,
    SelectChangeEvent,
    IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import { designationService } from '../../services/designations.service';
import { AppContext } from '../../Context/AppContext';
import { appContextType } from '../../types';
import sampleCsv from '../../assets/sample-files/MasterDesignation_Sample.csv';

// Import dialogs from bulk-upload/master-designation
import { UploadDesignationsDialog } from '../../Components/bulk-upload/master-designation/UploadDesignationsDialog';
import { CreateDesignationDialog } from '../../Components/bulk-upload/master-designation/CreateDesignationDialog';

interface DesignationsViewProps {
    ticketDetails?: any;
}

interface MasterDesignation {
    name: string;
    id: string;
    description: string;
    status: string;
    designation: string;
}

export const DesignationsView: React.FC<DesignationsViewProps> = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [designations, setDesignations] = useState<MasterDesignation[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active');

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    // Context for permissions (optional, but good practice if available)
    const { checkPermissions } = useContext(AppContext) as appContextType;
    const permissions = checkPermissions ? checkPermissions('/bulk-upload/master-designation') : { canWrite: true };

    const fetchDesignations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await designationService.searchMasterDesignations(
                searchQuery,
                rowsPerPage,
                page,
                statusFilter
            );

            if (response?.result?.result?.data) {
                setDesignations(response.result.result.data);
                setTotalCount(response.result.result.totalCount || 0);
            } else {
                setDesignations([]);
                setTotalCount(0);
            }
        } catch (err: any) {
            console.error('Error fetching designations:', err);
            setError('Failed to load designations. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, page, rowsPerPage, statusFilter]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchDesignations();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [fetchDesignations]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleStatusChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value as string);
        setPage(0);
    };

    return (
        <Paper elevation={0} sx={{ width: '100%', p: 2, border: '1px solid #e0e0e0', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
            {/* Header Actions */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    href={sampleCsv}
                    download="MasterDesignation_Sample.csv"
                    sx={{ textTransform: 'uppercase' }}
                >
                    Download Sample
                </Button>
                {permissions.canWrite && (
                    <>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateDialogOpen(true)}
                            sx={{ textTransform: 'uppercase' }}
                        >
                            Create Designation
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<UploadFileIcon />}
                            onClick={() => setUploadDialogOpen(true)}
                            sx={{ textTransform: 'uppercase' }}
                        >
                            Upload Designations
                        </Button>
                    </>
                )}
            </Box>

            {/* Filter Bar */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search designations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                    >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Error Message */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Loading State */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <TableContainer sx={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 1,
                        flex: '0 1 auto',
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { display: 'none' },
                        '-ms-overflow-style': 'none',
                        'scrollbar-width': 'none'
                    }}>
                        <Table stickyHeader size="medium" sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '55%' }}>Designation Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '15%', textAlign: 'center' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '30%' }}>Description</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {designations.length > 0 ? (
                                    designations.map((item) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {item.designation}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={item.status}
                                                    size="small"
                                                    color={item.status === 'Live' || item.status === 'Active' ? 'success' : 'default'}
                                                    variant="outlined"
                                                    sx={{
                                                        height: 24,
                                                        borderColor: item.status === 'Live' || item.status === 'Active' ? '#4caf50' : '#bdbdbd',
                                                        color: item.status === 'Live' || item.status === 'Active' ? '#2e7d32' : '#757575',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical',
                                                }}>
                                                    {item.description || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                No designations found{searchQuery ? ` matching "${searchQuery}"` : ''}.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <TablePagination
                        component="div"
                        count={totalCount}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 25, 50]}
                        sx={{ mt: 1 }}
                    />
                </>
            )}

            {/* Reuse existing dialogs */}
            <UploadDesignationsDialog
                open={uploadDialogOpen}
                onClose={() => setUploadDialogOpen(false)}
                onUploadSuccess={() => fetchDesignations()}
            />
            <CreateDesignationDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSuccess={() => fetchDesignations()}
            />
        </Paper>
    );
};
