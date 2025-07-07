import React from 'react';
import { 
  Grid, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Alert,
  Typography
} from '@mui/material';
import { ContentRequest, FormErrors } from '../types';
import { getPrimaryCategories, getMimeTypes, extractTime } from '../utils/contentHelpers';

interface ContentCreateFormProps {
  contentData: ContentRequest;
  formErrors: FormErrors;
  isEditMode: boolean;
  isPrimaryCategoryValid: boolean;
  createResponseId: string | undefined;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (e: any) => void;
  handleTimeInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLocationChange: (place: string) => void;
  user: any;
}

const ContentCreateForm: React.FC<ContentCreateFormProps> = ({
  contentData,
  formErrors,
  isEditMode,
  isPrimaryCategoryValid,
  createResponseId,
  handleInputChange,
  handleSelectChange,
  handleTimeInput,
  handleLocationChange,
  user
}) => {
  const primaryCategories = getPrimaryCategories();
  const mimeTypes = getMimeTypes();
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {isEditMode ? 'Edit Content Details' : 
           createResponseId ? 'Update Content Details' : 'Create Content Details'}
        </Typography>
      </Grid>

      {createResponseId && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Content already created with ID: {createResponseId}. You can proceed to the next step or make changes and create new content.
          </Alert>
        </Grid>
      )}

      {createResponseId && !isEditMode && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Content already created with ID: {createResponseId}. You can make changes to the form fields and click "Update Content" to save your changes.
          </Alert>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          {isEditMode 
            ? 'In edit mode, only Registration End Date, End Date, and End Time can be modified.'
            : 'Fields marked with * are required. The Registration End Date must be between the Start Date and End Date.'}
        </Alert>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          name="name"
          label="Content Name *"
          fullWidth
          value={contentData.name}
          onChange={handleInputChange}
          required
          margin="normal"
          error={Boolean(formErrors.name)}
          helperText={formErrors.name || ''}
          disabled={isEditMode}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          name="description"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={contentData.description}
          onChange={handleInputChange}
          margin="normal"
          disabled={isEditMode}
        />
      </Grid>

      {/* Location field - nested object */}
      <Grid item xs={12} md={6}>
        <TextField
          name="locationPlace"
          label="Location *"
          fullWidth
          value={contentData.location?.place || ''}
          onChange={(e) => handleLocationChange(e.target.value)}
          required
          margin="normal"
          error={Boolean(formErrors.locationPlace)}
          helperText={formErrors.locationPlace || ''}
          disabled={isEditMode}
        />
      </Grid>

      {/* Date fields */}
      <Grid item xs={12} md={6}>
        <TextField
          name="startDate"
          label="Start Date *"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={contentData.startDate}
          onChange={handleInputChange}
          required
          margin="normal"
          error={Boolean(formErrors.startDate)}
          helperText={formErrors.startDate || ''}
          disabled={isEditMode}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          name="endDate"
          label="End Date *"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={contentData.endDate}
          onChange={handleInputChange}
          required
          margin="normal"
          error={Boolean(formErrors.endDate)}
          helperText={formErrors.endDate || ''}
          // End date should be editable even in edit mode
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          name="registrationEndDate"
          label="Registration End Date *"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={contentData.registrationEndDate}
          onChange={handleInputChange}
          required
          margin="normal"
          error={Boolean(formErrors.registrationEndDate)}
          helperText={formErrors.registrationEndDate || ''}
          // Registration end date should be editable even in edit mode
        />
      </Grid>

      {/* Time fields - using standard text fields with type="time" */}
      <Grid item xs={12} md={6}>
        <TextField
          name="startTime"
          label="Start Time *"
          type="time"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={extractTime(contentData.startTime)}
          onChange={handleTimeInput}
          required
          margin="normal"
          error={Boolean(formErrors.startTime)}
          helperText={formErrors.startTime || ''}
          disabled={isEditMode}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          name="endTime"
          label="End Time *"
          type="time"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={extractTime(contentData.endTime)}
          onChange={handleTimeInput}
          required
          margin="normal"
          error={Boolean(formErrors.endTime)}
          helperText={formErrors.endTime || ''}
          // End time should be editable even in edit mode
        />
      </Grid>

      {/* CreatedBy is now hidden as we're using the logged-in user's ID */}
      <Grid item xs={12} md={6}>
        <TextField
          name="createdBy"
          label="Created By"
          fullWidth
          value={contentData.createdBy || (user?.userId || '')}
          disabled
          margin="normal"
          helperText={user?.name ? `Using ${user.name}'s account` : "Using your account ID"}
        />
      </Grid>

      {/* Channel field - always disabled with default value "igot" */}
      <Grid item xs={12} md={6}>
        <TextField
          name="channel"
          label="Channel"
          fullWidth
          value={contentData.channel}
          disabled
          margin="normal"
          helperText="Default channel for all content"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          name="source"
          label="Source"
          fullWidth
          value={contentData.source}
          disabled
          margin="normal"
          helperText="Default source for all content"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Primary Category *</InputLabel>
          <Select
            name="primaryCategory"
            value={contentData.primaryCategory}
            onChange={handleSelectChange}
            required
            disabled={isPrimaryCategoryValid || isEditMode} // Disable if the primary category from query is valid or in edit mode
          >
            <MenuItem value="career">Career</MenuItem>
            {primaryCategories.map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
          {isPrimaryCategoryValid && (
            <FormHelperText>Category set from URL parameter</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>MIME Type *</InputLabel>
          <Select
            name="mimeType"
            value={contentData.mimeType}
            onChange={handleSelectChange}
            required
            disabled={isEditMode}
          >
            {mimeTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Position</InputLabel>
          <Select
            name="position"
            value={contentData.position}
            onChange={handleSelectChange}
            disabled={isEditMode}
          >
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default ContentCreateForm;