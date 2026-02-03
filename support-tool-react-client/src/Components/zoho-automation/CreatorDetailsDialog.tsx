import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Grid,
    Divider,
    Alert
} from '@mui/material';
import { usersService } from '../../services/users.service';

interface CreatorDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    userId: string | null;
}

export const CreatorDetailsDialog: React.FC<CreatorDetailsDialogProps> = ({ open, onClose, userId }) => {
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!userId || !open) return;

            setLoading(true);
            setError(null);
            setUserData(null);

            try {
                // Using the same search payload structure as UserDetailsView
                const payload = {
                    request: {
                        filters: {
                            userId: [userId]
                        },
                        fields: [], // Fetch all fields
                        limit: 1,
                        offset: 0
                    }
                };

                const response = await usersService.getUsers(payload);
                const users = response?.result?.response?.content || [];

                if (users.length > 0) {
                    setUserData(users[0]);
                } else {
                    setError('User details not found.');
                }
            } catch (err: any) {
                console.error('Error fetching creator details:', err);
                setError('Failed to load user details.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [userId, open]);

    const handleClose = () => {
        onClose();
        setUserData(null);
        setError(null);
    };

    const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
        <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                {label}
            </Typography>
            <Typography variant="body1">{value || '-'}</Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                Creator Details
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : userData ? (
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                {userData.firstName} {userData.lastName}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        <Grid item xs={6}>
                            <DetailRow
                                label="Primary Email"
                                value={userData.email || userData.listMaskedEmail || userData.profileDetails?.personalDetails?.primaryEmail}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DetailRow
                                label="Phone"
                                value={userData.phone || userData.maskedPhone || userData.profileDetails?.personalDetails?.mobile}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DetailRow
                                label="Creator ID"
                                value={userData.userId || userData.identifier}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DetailRow
                                label="Organization"
                                value={userData.rootOrg?.orgName || userData.rootOrgName}
                            />
                        </Grid>
                    </Grid>
                ) : null}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
                <Button onClick={handleClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};
