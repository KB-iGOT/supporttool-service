import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    SelectChangeEvent,
    Snackbar,
    AlertColor,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { TicketDetails } from '../../services/zoho.service';
import { usersService } from '../../services/users.service';
import { DynamicFormDialog } from '../common-components/dynamic-form-dialog/DynamicFormDialog';
import { FieldDefinition, FormData as CustomFormData } from '../../types/forms';
import { getNestedValue } from '../../utils/pathResolver';
import { AppContext } from '../../Context/AppContext';
import { appContextType } from '../../types';

// Import existing dialogs
import { EditPrimaryDetailsDialog } from '../users/list-user/EditPrimaryDetailsDialog';
import { PasswordResetDialog } from '../users/list-user/PasswordResetDialog';
import { RoleAssignmentDialog } from '../users/list-user/RoleAssignmentDialog';
import { UserBlockDialog } from '../users/list-user/UserBlockDialog';
import { UserMigrationDialog } from '../users/list-user/UserMigrationDialog';

interface UserDetailsViewProps {
    ticketDetails: TicketDetails;
    onUserSelect?: (userId: string, userInfo: { name: string; email: string }) => void;
}

interface UserProfile {
    userId: string;
    identifier?: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    email?: string;
    maskedEmail?: string;
    phone?: string;
    maskedPhone?: string;
    rootOrg?: { orgName?: string };
    rootOrgName?: string;
    rootOrgId?: string;
    channel?: string;
    status?: number;
    isDeleted?: boolean;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    stateValidated?: boolean;
    sourceCreationType?: string;
    createdDate?: string;
    updatedDate?: string;
    first_login?: string;
    last_login?: string;
    profileDetails?: {
        profileStatus?: string;
        profileDesignationStatus?: string;
        profileGroupStatus?: string;
        verifiedKarmayogi?: boolean;
        profileStatusUpdatedOn?: string;
        ministryOrStateId?: string;
        ministryOrStateOrgName?: string;
        mandatoryFieldsExists?: boolean;
        personalDetails?: {
            firstname?: string;
            gender?: string;
            dob?: string;
            category?: string;
            domicileMedium?: string;
            pincode?: string;
            mobile?: string;
            primaryEmail?: string;
            phoneVerified?: boolean;
        };
        professionalDetails?: Array<{
            designation?: string;
            organisationType?: string;
            group?: string;
            osid?: string;
        }>;
        employmentDetails?: {
            departmentName?: string;
            employeeCode?: string;
            pinCode?: string;
        };
        additionalProperties?: {
            externalSystemId?: string;
            externalSystem?: string;
        };
    };
    organisations?: Array<{
        organisationId?: string;
        orgName?: string;
        roles?: string[];
        orgjoindate?: string;
        orgLeftDate?: string;
        isDeleted?: boolean;
        isApproved?: boolean;
        associationType?: number;
    }>;
    roles?: Array<{ role: string }>;
}

type SearchFieldType = 'email' | 'phone' | 'name' | 'userId';

// Search field configurations
const searchFieldConfig: Record<SearchFieldType, { path: string; isQuery: boolean }> = {
    email: { path: 'email', isQuery: false },
    phone: { path: 'phone', isQuery: false },
    name: { path: 'query', isQuery: true },
    userId: { path: 'userId', isQuery: false },
};

// Edit user fields
const editUserFields: FieldDefinition[] = [
    {
        identifier: 'firstname',
        name: 'firstname',
        displayName: 'Name',
        fieldType: 'text',
        optional: false,
        selected: true,
        order: 1,
        placeholder: 'Enter name',
        fieldPath: 'profileDetails.personalDetails.firstname',
    },
    {
        identifier: 'email',
        name: 'email',
        displayName: 'Email',
        fieldType: 'email',
        optional: false,
        selected: true,
        order: 2,
        placeholder: 'Enter email',
        fieldPath: 'profileDetails.personalDetails.primaryEmail',
    },
    {
        identifier: 'phone',
        name: 'phone',
        displayName: 'Phone',
        fieldType: 'tel',
        optional: true,
        selected: true,
        order: 3,
        placeholder: 'Enter phone',
        fieldPath: 'profileDetails.personalDetails.mobile',
    },
    {
        identifier: 'externalSystemId',
        name: 'externalSystemId',
        displayName: 'External System ID',
        fieldType: 'text',
        optional: true,
        selected: true,
        order: 4,
        placeholder: 'Enter External System ID',
        fieldPath: 'profileDetails.additionalProperties.externalSystemId',
    },
];

const UserDetailsView: React.FC<UserDetailsViewProps> = ({ ticketDetails, onUserSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<SearchFieldType>('email');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [toast, setToast] = useState<{ message: string; open: boolean; severity: AlertColor }>({
        message: '',
        open: false,
        severity: 'info'
    });

    // Dialog states for all actions
    const [primaryDetailsDialogOpen, setPrimaryDetailsDialogOpen] = useState(false);
    const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
    const [dialogProcessing, setDialogProcessing] = useState(false);

    // State for expanded user details
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    // Notify parent when user is selected
    useEffect(() => {
        if (expandedUserId && onUserSelect) {
            const selectedUser = users.find(u => (u.identifier || u.userId) === expandedUserId);
            if (selectedUser) {
                onUserSelect(expandedUserId, {
                    name: selectedUser.userName || selectedUser.firstName || 'Unknown',
                    email: selectedUser.email || selectedUser.maskedEmail || ''
                });
            }
        }
    }, [expandedUserId, onUserSelect, users]);

    // Get current user ID from context
    const { user: contextUser } = useContext(AppContext) as appContextType;
    const currentUserId = contextUser?.userId || '';

    // Refs for auto-search
    const autoSearchDone = useRef(false);

    // Extract contact info from ticket
    const contactEmail = ticketDetails.email || ticketDetails.contact?.email || null;
    const contactPhone = ticketDetails.phone || ticketDetails.contact?.phone || null;

    // Construct Zoho ticket URL for audit logging
    const getZohoTicketUrl = () => {
        const ticketId = ticketDetails.id;
        return ticketId
            ? `https://desk.zoho.in/agent/karmayogibharat/karmayogi-bharat/tickets/details/${ticketId}`
            : 'Zoho Automation - User Update';
    };

    // Helper function to perform search
    const performSearch = useCallback(async (query: string, type: SearchFieldType): Promise<UserProfile[]> => {
        const config = searchFieldConfig[type];
        let requestPayload: any = {
            request: {
                fields: [],
                facets: [],
                limit: 20,
                offset: 0,
                filters: {}
            }
        };

        if (config.isQuery) {
            requestPayload.query = query.trim();
        } else {
            requestPayload.request.filters[config.path] = [query.trim()];
        }

        const response = await usersService.getUsers(requestPayload);
        return response?.result?.response?.content || [];
    }, []);

    // Auto-search on component mount
    useEffect(() => {
        const autoSearch = async () => {
            if (autoSearchDone.current) return;
            if (!contactEmail && !contactPhone) return;

            autoSearchDone.current = true;
            setLoading(true);
            setError(null);
            setSearched(true);

            try {
                // Try email first
                if (contactEmail) {
                    setSearchQuery(contactEmail);
                    setSearchType('email');
                    const results = await performSearch(contactEmail, 'email');

                    if (results.length > 0) {
                        setUsers(results);
                        setLoading(false);
                        return;
                    }
                    // Email search returned no results
                    setError(`No users found with email: ${contactEmail}`);
                }

                // Fallback to phone if no results from email
                if (contactPhone) {
                    setSearchQuery(contactPhone);
                    setSearchType('phone');
                    const results = await performSearch(contactPhone, 'phone');

                    if (results.length > 0) {
                        setUsers(results);
                        setError(null); // Clear email error
                        setLoading(false);
                        return;
                    }
                }

                setError('No users found with the contact email or phone from the ticket');
            } catch (err: any) {
                console.error('Auto-search failed:', err);
                setError('Failed to auto-search user');
            } finally {
                setLoading(false);
            }
        };

        autoSearch();
    }, [contactEmail, contactPhone, performSearch]);

    // Auto-expand first user when results are loaded
    useEffect(() => {
        if (users.length > 0 && !expandedUserId) {
            setExpandedUserId(users[0].identifier || users[0].userId);
        }
    }, [users, expandedUserId]);

    // Manual search
    const searchUsers = useCallback(async () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search query');
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const results = await performSearch(searchQuery, searchType);
            setUsers(results);

            if (results.length === 0) {
                setError('No users found matching your search criteria');
            }
        } catch (err: any) {
            console.error('Error searching users:', err);
            setError(err.response?.data?.message || 'Failed to search users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, searchType, performSearch]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchUsers();
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserProfile) => {
        setAnchorEl(event.currentTarget);
        setSelectedUser(user);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Handle edit user
    const handleEditUser = () => {
        if (selectedUser) {
            setEditingUser(selectedUser);
            setEditDialogOpen(true);
        }
        handleMenuClose();
    };

    // Handle save user edits
    const handleSaveUserEdit = async (formData: CustomFormData) => {
        if (!editingUser) return;

        try {
            setLoading(true);

            const updatePayload: any = {
                request: {
                    userId: editingUser.identifier || editingUser.userId,
                    profileDetails: JSON.parse(JSON.stringify(editingUser.profileDetails || {}))
                }
            };

            const changedFields: Record<string, any> = {};

            // Process each field
            editUserFields.forEach(field => {
                const newValue = formData[field.identifier];
                const originalValue = field.fieldPath ?
                    getNestedValue(editingUser, field.fieldPath) :
                    (editingUser as any)[field.identifier];

                if (String(newValue) !== String(originalValue) && newValue !== undefined) {
                    changedFields[field.displayName] = { original: originalValue, new: newValue };

                    if (field.fieldPath) {
                        const pathParts = field.fieldPath.split('.');

                        if (field.identifier === 'email') {
                            updatePayload.request.email = newValue;
                            if (!updatePayload.request.profileDetails.personalDetails) {
                                updatePayload.request.profileDetails.personalDetails = {};
                            }
                            updatePayload.request.profileDetails.personalDetails.primaryEmail = newValue;
                        } else if (field.identifier === 'phone') {
                            updatePayload.request.phone = newValue;
                            if (!updatePayload.request.profileDetails.personalDetails) {
                                updatePayload.request.profileDetails.personalDetails = {};
                            }
                            updatePayload.request.profileDetails.personalDetails.mobile = newValue;
                        } else {
                            let current = updatePayload.request;
                            for (let i = 0; i < pathParts.length - 1; i++) {
                                if (!current[pathParts[i]]) current[pathParts[i]] = {};
                                current = current[pathParts[i]];
                            }
                            current[pathParts[pathParts.length - 1]] = newValue;
                        }
                    }
                }
            });

            if (Object.keys(changedFields).length === 0) {
                setToast({ message: 'No changes were made', open: true, severity: 'info' });
                setEditDialogOpen(false);
                return;
            }

            // Construct Zoho ticket URL for audit logging
            const ticketId = ticketDetails.id;
            const zohoTicketUrl = ticketId
                ? `https://desk.zoho.in/agent/karmayogibharat/karmayogi-bharat/tickets/details/${ticketId}`
                : 'Zoho Automation - User Update';

            const response = await usersService.updateUser({
                payload: updatePayload,
                changedFields,
                userId: editingUser.identifier || editingUser.userId,
                jiraLink: zohoTicketUrl,
                module: 'zoho-automation',
            });

            if (response?.responseCode === 'OK') {
                setToast({ message: 'User updated successfully', open: true, severity: 'success' });
                setEditDialogOpen(false);
                // Refresh search
                searchUsers();
            } else {
                throw new Error(response?.responseMessage || 'Failed to update user');
            }
        } catch (err: any) {
            console.error('Error updating user:', err);
            setToast({
                message: err.response?.data?.error?.params?.errmsg || err.message || 'Failed to update user',
                open: true,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action: string) => {
        if (!selectedUser) {
            handleMenuClose();
            return;
        }

        const userForAction = selectedUser; // Capture user before closing menu
        console.log('handleAction called:', action, 'user:', userForAction);

        handleMenuClose(); // Close menu first
        setEditingUser(userForAction);

        // Use setTimeout to ensure state is updated before opening dialog
        setTimeout(() => {
            console.log('Opening dialog for action:', action);
            switch (action) {
                case 'edit':
                    setEditDialogOpen(true);
                    break;
                case 'editPrimary':
                    setPrimaryDetailsDialogOpen(true);
                    break;
                case 'roles':
                    setRoleDialogOpen(true);
                    break;
                case 'resetPassword':
                    setPasswordResetDialogOpen(true);
                    break;
                case 'migrate':
                    setMigrationDialogOpen(true);
                    break;
                case 'block':
                    setBlockDialogOpen(true);
                    break;
                case 'view':
                    window.open(`/users/${userForAction.identifier || userForAction.userId}`, '_blank');
                    break;
                case 'certificate':
                    window.open(`/users/re-issue-certificate?userId=${userForAction.identifier || userForAction.userId}`, '_blank');
                    break;
            }
        }, 0);
    };

    const getStatusChip = (status: number) => {
        if (status === 1) return <Chip label="Active" color="success" size="small" />;
        if (status === 0) return <Chip label="Blocked" color="error" size="small" />;
        return <Chip label="Unknown" color="default" size="small" />;
    };

    const getProfileStatusChip = (profileStatus?: string) => {
        if (!profileStatus) return null;
        const color = profileStatus === 'VERIFIED' ? 'success' :
            profileStatus === 'NOT-VERIFIED' ? 'warning' : 'default';
        return <Chip label={profileStatus} color={color as any} size="small" variant="outlined" />;
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Search Panel */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Search Users
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Search By</InputLabel>
                        <Select
                            value={searchType}
                            label="Search By"
                            onChange={(e: SelectChangeEvent) => setSearchType(e.target.value as SearchFieldType)}
                        >
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="phone">Phone</MenuItem>
                            <MenuItem value="name">Name</MenuItem>
                            <MenuItem value="userId">User ID</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        placeholder={`Enter ${searchType}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        sx={{ flex: 1 }}
                    />
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                        onClick={searchUsers}
                        disabled={loading || !searchQuery.trim()}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>

            {/* Error/Info Message */}
            {error && (
                <Alert severity={users.length === 0 && searched ? 'info' : 'error'} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Users Table */}
            {users.length > 0 && (
                <>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><strong>Name</strong></TableCell>
                                    <TableCell><strong>Organization</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Phone</strong></TableCell>
                                    <TableCell><strong>User Status</strong></TableCell>
                                    <TableCell><strong>Profile Status</strong></TableCell>
                                    <TableCell align="right"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => {
                                    const isExpanded = expandedUserId === (user.identifier || user.userId);
                                    return (
                                        <TableRow
                                            key={user.userId || user.identifier}
                                            hover
                                            onClick={() => setExpandedUserId(isExpanded ? null : (user.identifier || user.userId))}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: isExpanded ? '#e3f2fd' : 'inherit',
                                                '&:hover': { backgroundColor: isExpanded ? '#bbdefb' : undefined }
                                            }}
                                        >
                                            <TableCell>{user.firstName} {user.lastName}</TableCell>
                                            <TableCell>{user.rootOrg?.orgName || user.rootOrgName || '-'}</TableCell>
                                            <TableCell>{user.email || '-'}</TableCell>
                                            <TableCell>{user.maskedPhone || user.phone || '-'}</TableCell>
                                            <TableCell>{getStatusChip(user.status || 1)}</TableCell>
                                            <TableCell>{getProfileStatusChip(user.profileDetails?.profileStatus)}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, user); }}>
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Expanded User Details Section */}
                    {expandedUserId && (() => {
                        const expandedUser = users.find(u => (u.identifier || u.userId) === expandedUserId) as any;
                        if (!expandedUser) return null;

                        // Helper to format field names from camelCase/snake_case to Title Case
                        const formatFieldName = (key: string): string => {
                            return key
                                .replace(/_/g, ' ')
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())
                                .trim();
                        };

                        // Helper to format values
                        const formatValue = (value: any): string => {
                            if (value === null || value === undefined || value === '') return '-';
                            if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                            if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
                            if (typeof value === 'object') return JSON.stringify(value);
                            // Check if it looks like a date
                            if (typeof value === 'string' && (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}/))) {
                                try {
                                    const date = new Date(value);
                                    if (!isNaN(date.getTime())) {
                                        return date.toLocaleString('en-IN');
                                    }
                                } catch { }
                            }
                            return String(value);
                        };

                        const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                                    {label}
                                </Typography>
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>
                            </Grid>
                        );

                        // Render all fields from an object dynamically
                        const renderObjectFields = (obj: any, excludeKeys: string[] = []) => {
                            if (!obj || typeof obj !== 'object') return null;
                            return Object.entries(obj)
                                .filter(([key]) => !excludeKeys.includes(key))
                                .filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
                                .map(([key, value]) => (
                                    <DetailRow key={key} label={formatFieldName(key)} value={formatValue(value)} />
                                ));
                        };

                        // Fields to exclude from basic details (shown elsewhere or not useful)
                        const excludeFromBasic = ['profileDetails', 'organisations', 'roles', 'framework', 'allTncAccepted', 'profileUserTypes', 'profileUserType', 'profileLocation', 'locationIds'];

                        return (
                            <Box sx={{ mt: 2 }}>
                                {/* Advanced Details - All top-level fields */}
                                <Accordion expanded={true}>
                                    <AccordionSummary>
                                        <Typography fontWeight={600}>Advanced Details</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            {renderObjectFields(expandedUser, excludeFromBasic)}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Profile Details - Dynamically render all nested objects */}
                                {expandedUser.profileDetails && (
                                    <Accordion expanded={true}>
                                        <AccordionSummary>
                                            <Typography fontWeight={600}>Profile Details</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {/* Top-level profile fields */}
                                            <Grid container spacing={2}>
                                                {renderObjectFields(expandedUser.profileDetails, ['personalDetails', 'professionalDetails', 'employmentDetails', 'additionalProperties', 'get_started_tour'])}
                                            </Grid>

                                            {/* Personal Details */}
                                            {expandedUser.profileDetails.personalDetails && (
                                                <>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Personal Details</Typography>
                                                    <Grid container spacing={2}>
                                                        {renderObjectFields(expandedUser.profileDetails.personalDetails)}
                                                    </Grid>
                                                </>
                                            )}

                                            {/* Professional Details */}
                                            {expandedUser.profileDetails.professionalDetails && expandedUser.profileDetails.professionalDetails.length > 0 && (
                                                <>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Professional Details</Typography>
                                                    {expandedUser.profileDetails.professionalDetails.map((prof: any, idx: number) => (
                                                        <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                                                            <Grid container spacing={2}>
                                                                {renderObjectFields(prof)}
                                                            </Grid>
                                                        </Paper>
                                                    ))}
                                                </>
                                            )}

                                            {/* Employment Details */}
                                            {expandedUser.profileDetails.employmentDetails && (
                                                <>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Employment Details</Typography>
                                                    <Grid container spacing={2}>
                                                        {renderObjectFields(expandedUser.profileDetails.employmentDetails)}
                                                    </Grid>
                                                </>
                                            )}

                                            {/* Additional Properties */}
                                            {expandedUser.profileDetails.additionalProperties && Object.keys(expandedUser.profileDetails.additionalProperties).length > 0 && (
                                                <>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Additional Properties</Typography>
                                                    <Grid container spacing={2}>
                                                        {renderObjectFields(expandedUser.profileDetails.additionalProperties)}
                                                    </Grid>
                                                </>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                )}

                                {/* Organizations - Dynamically render all fields */}
                                <Accordion expanded={true}>
                                    <AccordionSummary>
                                        <Typography fontWeight={600}>Organizations ({expandedUser.organisations?.length || 0})</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {expandedUser.organisations && expandedUser.organisations.length > 0 ? (
                                            expandedUser.organisations.map((org: any, idx: number) => (
                                                <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1 }}>
                                                    <Grid container spacing={2}>
                                                        {renderObjectFields(org)}
                                                    </Grid>
                                                </Paper>
                                            ))
                                        ) : (
                                            <Typography color="text.secondary">No organizations found</Typography>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        );
                    })()}
                </>
            )}

            {/* Loading State */}
            {loading && !users.length && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Empty/Initial State */}
            {!loading && !error && !searched && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        Searching for user from ticket contact...
                    </Typography>
                </Paper>
            )}

            {/* Actions Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleAction('edit')}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit User Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction('editPrimary')}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit Primary Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction('roles')}>
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Manage User Roles</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction('resetPassword')}>
                    <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Reset Password</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction('migrate')}>
                    <ListItemIcon><CompareArrowsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Migrate User</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction('block')}>
                    <ListItemIcon>
                        {selectedUser?.status === 1 ? <BlockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText>{selectedUser?.status === 1 ? 'Block User' : 'Unblock User'}</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction('view')}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>View Full Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction('certificate')}>
                    <ListItemIcon><CardMembershipIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Re-issue Certificate</ListItemText>
                </MenuItem>
            </Menu>

            {/* Edit User Dialog */}
            {editDialogOpen && editingUser && (
                <DynamicFormDialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    title="Edit User Details"
                    fields={editUserFields}
                    onSubmit={handleSaveUserEdit}
                    initialData={editingUser}
                />
            )}

            {/* Edit Primary Details Dialog */}
            <EditPrimaryDetailsDialog
                open={primaryDetailsDialogOpen}
                onClose={() => {
                    setPrimaryDetailsDialogOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser as any}
                onSubmit={async (details) => {
                    setDialogProcessing(true);
                    try {
                        // Handle primary details update
                        const response = await usersService.updateUserExt({
                            userId: editingUser?.identifier || editingUser?.userId,
                            ...details,
                            jiraLink: getZohoTicketUrl(),
                        });
                        if (response?.responseCode === 'OK') {
                            setToast({ message: 'Primary details updated successfully', open: true, severity: 'success' });
                            setPrimaryDetailsDialogOpen(false);
                            searchUsers();
                        }
                    } catch (err: any) {
                        setToast({ message: err.message || 'Failed to update', open: true, severity: 'error' });
                    } finally {
                        setDialogProcessing(false);
                    }
                }}
                processing={dialogProcessing}
            />

            {/* Password Reset Dialog */}
            <PasswordResetDialog
                open={passwordResetDialogOpen}
                onClose={() => {
                    setPasswordResetDialogOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser as any}
                onResetPassword={async (userId, notificationType, setLoading) => {
                    setLoading(true);
                    const response = await usersService.resetPassword({
                        userId,
                        type: notificationType,
                        jiraLink: getZohoTicketUrl(),
                    });
                    return response?.result?.link || '';
                }}
            />

            {/* Role Assignment Dialog */}
            <RoleAssignmentDialog
                open={roleDialogOpen}
                onClose={() => {
                    setRoleDialogOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser as any}
                onRoleAssign={async (userId, orgId, roles, initialRoles) => {
                    try {
                        await usersService.modifyUserRoles({
                            userId,
                            organisationId: orgId,
                            roles,
                            initialRoles,
                            jiraLink: getZohoTicketUrl(),
                        });
                        setToast({ message: 'Roles updated successfully', open: true, severity: 'success' });
                        searchUsers();
                    } catch (err: any) {
                        const message = err?.response?.data?.error?.params?.errmsg || err?.response?.data?.responseMessage || 'Failed to update roles';
                        setToast({ message, open: true, severity: 'error' });
                    }
                }}
            />

            {/* User Block Dialog */}
            <UserBlockDialog
                open={blockDialogOpen}
                onClose={() => {
                    setBlockDialogOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser as any}
                onBlockUser={async (userId, currentStatus, requestedById) => {
                    const action = currentStatus === 1 ? usersService.blockUser : usersService.unblockUser;
                    await action({
                        userId,
                        requestedById,
                        jiraLink: getZohoTicketUrl(),
                    });
                    setToast({ message: currentStatus === 1 ? 'User blocked' : 'User unblocked', open: true, severity: 'success' });
                    searchUsers();
                }}
                currentUserId={currentUserId}
            />

            {/* User Migration Dialog */}
            <UserMigrationDialog
                open={migrationDialogOpen}
                onClose={() => {
                    setMigrationDialogOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser as any}
                onMigrate={async (userId, data) => {
                    await usersService.migrateUser({
                        userId,
                        ...data,
                        jiraLink: getZohoTicketUrl(),
                    });
                    setToast({ message: 'User migrated successfully', open: true, severity: 'success' });
                    searchUsers();
                }}
            />

            {/* Toast notifications */}
            <Snackbar
                open={toast.open}
                autoHideDuration={5000}
                onClose={() => setToast({ ...toast, open: false })}
            >
                <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserDetailsView;
