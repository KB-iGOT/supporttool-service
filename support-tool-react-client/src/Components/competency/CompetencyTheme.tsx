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
import { CreateCompetencyThemeDialog } from './CreateCompetencyThemeDialog';

interface CompetencyTheme {
    id: string;
    title: string;
    description: string;
    status: string;
    competencyArea: string;
}

export const CompetencyThemeList: React.FC = () => {
    const [themes, setThemes] = useState<CompetencyTheme[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isCreating, setCreating] = useState(false);
    const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);

    const fetchThemes = useCallback(async () => {
        
        setLoading(true);
        setError(null);
        try {
            const params = {
                filterCriteriaMap: {
                    status: "Live",
                    isActive: true,
                },
                requestedFields: [],
                pageNumber: page,
                pageSize: rowsPerPage,
                ...(searchQuery && { searchString: searchQuery }),
            };
            const response = await competencyService.searchCompetencyThemes(params);
            
            if (response && response.data.result && response.data.result.result && response.data.result.result.data) {
                setThemes(response.data.result.result.data || []);
                setTotalCount(response.data.result.result.totalCount || 0);
            } else {
                setThemes([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error("Error fetching competency themes:", err);
            setError("Failed to fetch competency themes. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchThemes();
        }, 500); // Debounce search query

        return () => clearTimeout(debounceTimer);
    }, [fetchThemes]);

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

    const handleCreateTheme = async (data: any) => {
        setCreating(true);
        try {
            // Assuming a create service method exists
            await competencyService.createCompetencyTheme(data);
            console.log("Creating theme with:", data);
            setToast({ open: true, message: 'Theme created successfully!', severity: 'success' });
            setCreateDialogOpen(false);
            fetchThemes(); // Refresh list
        } catch (err) {
            console.error("Error creating competency theme:", err);
            setToast({ open: true, message: 'Failed to create theme.', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom>Competency Themes</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    Create Theme
                </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by theme name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
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
                                {themes.map((theme) => (
                                    <TableRow key={theme.id}>
                                        <TableCell>{theme.title}</TableCell>
                                        <TableCell>{theme.id}</TableCell>
                                        <TableCell>{theme.status}</TableCell>
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
            <CreateCompetencyThemeDialog
                open={isCreateDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSubmit={handleCreateTheme}
                processing={isCreating}
            />
        </Paper>
    );
};