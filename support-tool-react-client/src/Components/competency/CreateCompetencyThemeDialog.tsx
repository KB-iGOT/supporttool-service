import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    IconButton,
    Grid,
    CircularProgress,
    Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface CreateCompetencyThemeDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    processing: boolean;
}

export const CreateCompetencyThemeDialog: React.FC<CreateCompetencyThemeDialogProps> = ({
    open,
    onClose,
    onSubmit,
    processing,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState('');
    const [level, setLevel] = useState('');
    const [reviewedDate, setReviewedDate] = useState('');
    const [reviewedBy, setReviewedBy] = useState('');
    const [wfId, setWfId] = useState('');
    const [additionalProperties, setAdditionalProperties] = useState([{ key: '', value: '' }]);
    const [errors, setErrors] = useState({ title: false });

    useEffect(() => {
        if (!open) {
            setTitle('');
            setDescription('');
            setSource('');
            setLevel('');
            setReviewedDate('');
            setReviewedBy('');
            setWfId('');
            setAdditionalProperties([{ key: '', value: '' }]);
            setErrors({ title: false });
        }
    }, [open]);

    const handleAddProperty = () => {
        setAdditionalProperties([...additionalProperties, { key: '', value: '' }]);
    };

    const handleRemoveProperty = (index: number) => {
        const properties = [...additionalProperties];
        properties.splice(index, 1);
        setAdditionalProperties(properties);
    };

    const handlePropertyChange = (index: number, field: 'key' | 'value', fieldValue: string) => {
        const properties = [...additionalProperties];
        properties[index][field] = fieldValue;
        setAdditionalProperties(properties);
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            setErrors({ title: true });
            return;
        }
        setErrors({ title: false });

        const additionalPropsObject = additionalProperties.reduce((acc, prop) => {
            if (prop.key.trim()) {
                acc[prop.key.trim()] = prop.value.trim();
            }
            return acc;
        }, {} as Record<string, string>);

        const themeData = {
            title,
            description,
            source,
            level,
            reviewedDate,
            reviewedBy,
            wfId,
            additionalProperties: additionalPropsObject,
            refNodes: [],
        };

        onSubmit(themeData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create Competency Theme</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="title"
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                error={errors.title}
                                helperText={errors.title ? 'Title is required' : ' '}
                                disabled={processing}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                id="description"
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={processing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth id="source" label="Source" value={source} onChange={(e) => setSource(e.target.value)} disabled={processing} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth id="level" label="Level" value={level} onChange={(e) => setLevel(e.target.value)} disabled={processing} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth id="reviewedDate" label="Reviewed Date" type="date" InputLabelProps={{ shrink: true }} value={reviewedDate} onChange={(e) => setReviewedDate(e.target.value)} disabled={processing} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth id="reviewedBy" label="Reviewed By" value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} disabled={processing} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth id="wfId" label="Workflow ID" value={wfId} onChange={(e) => setWfId(e.target.value)} disabled={processing} />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Additional Properties</Typography>
                            {additionalProperties.map((prop, index) => (
                                <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                                    <Grid item xs={5}>
                                        <TextField fullWidth label="Key" value={prop.key} onChange={(e) => handlePropertyChange(index, 'key', e.target.value)} disabled={processing} />
                                    </Grid>
                                    <Grid item xs={5}>
                                        <TextField fullWidth label="Value" value={prop.value} onChange={(e) => handlePropertyChange(index, 'value', e.target.value)} disabled={processing} />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <IconButton onClick={() => handleRemoveProperty(index)} disabled={processing || additionalProperties.length === 1}>
                                            <RemoveIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))}
                            <Button startIcon={<AddIcon />} onClick={handleAddProperty} disabled={processing}>
                                Add Property
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={processing}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={processing}>
                    {processing ? <CircularProgress size={24} /> : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};