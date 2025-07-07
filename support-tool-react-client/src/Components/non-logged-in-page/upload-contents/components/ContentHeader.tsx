import React from 'react';
import { Box, Typography, Button, Tooltip, CircularProgress } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface ContentHeaderProps {
  isEditMode: boolean;
  doId?: string;
  primaryCategory?: string | null;
  isLoading?: boolean;
  onReset: () => void;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({
  isEditMode,
  doId,
  primaryCategory,
  isLoading,
  onReset
}) => {
  // Determine the appropriate header text based on mode and doId
  const getHeaderText = () => {
    if (isEditMode) {
      return `Edit ${primaryCategory || 'Content'}`;
    }
    
    if (doId) {
      return `Update ${primaryCategory || 'Content'}`;
    }
    
    return `Create New ${primaryCategory || 'Content'}`;
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          {getHeaderText()}
          {isLoading && (
            <CircularProgress size={20} sx={{ ml: 2 }} />
          )}
        </Typography>
        {doId && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 2 }}>
            ID: {doId}
          </Typography>
        )}
      </Box>
      
      <Tooltip title="Reset form">
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
        >
          Reset
        </Button>
      </Tooltip>
    </Box>
  );
};

export default ContentHeader;