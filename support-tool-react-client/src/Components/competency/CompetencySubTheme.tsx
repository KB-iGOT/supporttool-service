import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { competencyService } from '../../services/competency.service';
import { CreateCompetencySubThemeDialog } from './CreateCompetencySubThemeDialog';

interface CompetencySubTheme {
    id: string;
    title: string;
    description: string;
    status: string;
    theme: string; // Assuming theme is a string name
}

export const CompetencySubThemeList: React.FC = () => {
    const [subThemes, setSubThemes] = useState<CompetencySubTheme[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isCreating, setCreating] = useState(false);
    const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);

    const fetchSubThemes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                filterCriteriaMap: {
                    status: "Live",
                    isActive: true,
                    ...(searchQuery && { name: searchQuery }),
                },
                requestedFields: [],
                pageNumber: page,
                pageSize: rowsPerPage,
            };
            const response = await competencyService.searchCompetencySubThemes(params);
            // @ts-ignore
            if (response && response.data.result && response.data.result.result && response.data.result.result.data) {
                setSubThemes(response.data.result.result.data || []);
                setTotalCount(response.data.result.result.totalCount || 0);
            } else {
                setSubThemes([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error("Error fetching competency sub-themes:", err);
            setError("Failed to fetch competency sub-themes. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchSubThemes();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [fetchSubThemes]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        setPage(0);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCreateSubTheme = async (data: any) => {
        setCreating(true);
        try {
            // Assuming a create service method exists
            // await competencyService.createCompetencySubTheme(data);
            console.log("Creating sub-theme with:", data);
            setToast({ open: true, message: 'Sub-theme created successfully!', severity: 'success' });
            setCreateDialogOpen(false);
            fetchSubThemes(); // Refresh list
        } catch (err) {
            console.error("Error creating competency sub-theme:", err);
            setToast({ open: true, message: 'Failed to create sub-theme.', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom>Competency Sub-Themes</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    Create Sub-Theme
                </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by sub-theme name..."
                    value={searchQuery}
                    onChange={handleSearchChange} // Debounced
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
            {error && <Alert severity="error">{error}</Alert>}
            {toast && (
                <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ mb: 2 }}>
                    {toast.message}
                </Alert>
            )}


            {!loading && !error && (
                <>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Id</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {subThemes.map((subTheme) => (
                                    <TableRow key={subTheme.id}>
                                        <TableCell>{subTheme.title}</TableCell>
                                        <TableCell>{subTheme.id}</TableCell>
                                        <TableCell>{subTheme.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={totalCount}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </>
            )}
            <CreateCompetencySubThemeDialog
                open={isCreateDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSubmit={handleCreateSubTheme}
                processing={isCreating}
            />
        </Paper>
    );
};