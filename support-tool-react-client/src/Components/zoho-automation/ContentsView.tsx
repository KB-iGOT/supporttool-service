import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    CircularProgress,
    TablePagination,
    Divider,
    Checkbox,
    FormControlLabel,
    TextField,
    InputAdornment,
    Link
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { contentsService } from '../../services/contents.service';
import { CreatorDetailsDialog } from './CreatorDetailsDialog';

interface ContentsViewProps {
    ticketDetails: any;
}

interface ContentItem {
    identifier: string;
    name: string;
    courseCategory: string;
    posterImage: string;
    appIcon: string;
    createdOn: string;
    organisation: string[];
    avgRating: number;
    language: string[];
    source: string;
    primaryCategory: string;
    creatorIDs: string[]; // Added creatorIDs
}

interface FacetValue {
    name: string;
    count: number;
}

export const ContentsView: React.FC<ContentsViewProps> = ({ ticketDetails }) => {
    const [loading, setLoading] = useState(false);
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [categories, setCategories] = useState<FacetValue[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Creator Details Dialog State
    const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
    const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);

    // Initial fetch to get categories (facets)
    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const payload = {
                    request: {
                        filters: {
                            contentType: ["Course"],
                            courseCategory: { "!=": ["pre enrolment assessment"] },
                            status: ["Live"]
                        },
                        fields: ["name"],
                        facets: ["courseCategory"],
                        limit: 0,
                        offset: 0
                    }
                };

                const response = await contentsService.getContent(payload);
                if (response?.result?.facets) {
                    const categoryFacet = response.result.facets.find((f: any) => f.name === 'courseCategory');
                    if (categoryFacet && categoryFacet.values) {
                        setCategories(categoryFacet.values);
                    }
                }
            } catch (error) {
                console.error('Error fetching content categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Fetch contents
    useEffect(() => {
        const fetchContents = async () => {
            setLoading(true);
            try {
                const filters: any = {
                    contentType: ["Course"],
                    status: ["Live"]
                };

                if (selectedCategories.length > 0) {
                    filters.courseCategory = selectedCategories;
                }

                const payload = {
                    request: {
                        filters: filters,
                        query: searchQuery.trim(),
                        fields: [
                            "downloadUrl", "organisation", "language", "source", "appIcon",
                            "identifier", "name", "primaryCategory", "contentType",
                            "posterImage", "createdOn", "duration", "avgRating",
                            "additionalTags", "courseCategory", "mimeType", "contentId",
                            "creatorLogo", "sectorDetails_v1", "languageMapV1",
                            "language", "completionSurveyLink", "difficultyLevel",
                            "creatorIDs" // Added field
                        ],
                        limit: rowsPerPage,
                        offset: page * rowsPerPage,
                        sort_by: {}
                    }
                };

                const response = await contentsService.getContent(payload);
                if (response?.result) {
                    setContents(response.result.content || []);
                    setCount(response.result.count || 0);
                }
            } catch (error) {
                console.error('Error fetching contents:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchContents();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [selectedCategories, searchQuery, page, rowsPerPage]);

    const handleCategoryToggle = (categoryName: string) => {
        setPage(0);
        setSelectedCategories(prev => {
            if (prev.includes(categoryName)) {
                return prev.filter(c => c !== categoryName);
            } else {
                return [...prev, categoryName];
            }
        });
    };

    const handleAllToggle = () => {
        setPage(0);
        setSelectedCategories([]);
    };

    const isAllSelected = selectedCategories.length === 0;

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleCreatorClick = (creatorId: string) => {
        setSelectedCreatorId(creatorId);
        setCreatorDialogOpen(true);
    };

    return (
        <Paper elevation={0} sx={{ width: '100%', border: '1px solid #e0e0e0', display: 'flex', minHeight: 500 }}>
            {/* Left Sidebar - Categories */}
            <Box sx={{ width: 280, borderRight: '1px solid #e0e0e0', p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Category Type</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                        control={<Checkbox checked={isAllSelected} onChange={handleAllToggle} color="primary" />}
                        label={<Typography variant="body2" sx={{ fontWeight: isAllSelected ? 600 : 400 }}>All Contents</Typography>}
                    />
                    {categories.map((category) => (
                        <FormControlLabel
                            key={category.name}
                            control={
                                <Checkbox
                                    checked={selectedCategories.includes(category.name)}
                                    onChange={() => handleCategoryToggle(category.name)}
                                    color="primary"
                                />
                            }
                            label={<Typography variant="body2">{category.name} ({category.count})</Typography>}
                        />
                    ))}
                </Box>
            </Box>

            {/* Right Side - Content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Search Bar */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <TextField
                        fullWidth
                        placeholder="Search contents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Content List */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {contents.map((item, index) => (
                                <React.Fragment key={item.identifier}>
                                    <ListItem alignItems="flex-start" sx={{ p: 2 }}>
                                        <ListItemAvatar sx={{ mr: 2 }}>
                                            <Avatar
                                                variant="rounded"
                                                src={item.posterImage || item.appIcon}
                                                alt={item.name}
                                                sx={{ width: 80, height: 80 }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                    {item.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography variant="body2" color="text.secondary" component="span">
                                                        {item.courseCategory} | Created on {formatDate(item.createdOn)}
                                                    </Typography>

                                                    <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                                        <Typography variant="body2" component="span" sx={{ color: '#1976d2', fontWeight: 500 }}>
                                                            {item.organisation ? (Array.isArray(item.organisation) ? item.organisation.join(', ') : item.organisation) : item.source || 'Unknown'}
                                                        </Typography>

                                                        {item.avgRating && (
                                                            <Chip
                                                                icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                                                                label={item.avgRating.toFixed(1)}
                                                                size="small"
                                                                sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
                                                                color="warning"
                                                                variant="outlined"
                                                            />
                                                        )}

                                                        {item.creatorIDs && item.creatorIDs.length > 0 && (
                                                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid #ddd', borderRadius: '4px', px: 0.5, py: 0.25, bgcolor: '#f9f9f9' }}>
                                                                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary">Creator:</Typography>
                                                                {item.creatorIDs.map((id, idx) => (
                                                                    <Link
                                                                        key={id}
                                                                        component="button"
                                                                        variant="caption"
                                                                        onClick={() => handleCreatorClick(id)}
                                                                        sx={{ textDecoration: 'none', fontWeight: 600 }}
                                                                    >
                                                                        {id}{idx < item.creatorIDs.length - 1 ? ',' : ''}
                                                                    </Link>
                                                                ))}
                                                            </Box>
                                                        )}

                                                        {item.language && (
                                                            <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', border: '1px solid #ddd', borderRadius: '4px', px: 0.5 }}>
                                                                {Array.isArray(item.language) ? item.language[0] : item.language}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < contents.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                            {contents.length === 0 && (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography>No contents found matching your criteria.</Typography>
                                </Box>
                            )}
                        </List>
                    )}
                </Box>

                <Divider />
                <TablePagination
                    component="div"
                    count={count}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                />

                <CreatorDetailsDialog
                    open={creatorDialogOpen}
                    onClose={() => setCreatorDialogOpen(false)}
                    userId={selectedCreatorId}
                />
            </Box>
        </Paper>
    );
};

export default ContentsView;
