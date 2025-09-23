import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { CertificateDialogProps } from '../types';

export const CertificateDialog: React.FC<CertificateDialogProps> = ({
  open,
  certificateData,
  loadingCertificate,
  certificateError,
  downloadMenuAnchorEl,
  isDownloadMenuOpen,
  onClose,
  onDownloadButtonClick,
  onCloseDownloadMenu,
  onDownloadAsSVG,
  onDownloadAsPNG,
  onDownloadAsPDF
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Certificate Preview</Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={onDownloadButtonClick}
            disabled={!certificateData || loadingCertificate}
            aria-controls={isDownloadMenuOpen ? 'download-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isDownloadMenuOpen ? 'true' : undefined}
          >
            Download
          </Button>
          <Menu
            id="download-menu"
            anchorEl={downloadMenuAnchorEl}
            open={isDownloadMenuOpen}
            onClose={onCloseDownloadMenu}
            MenuListProps={{
              'aria-labelledby': 'download-button',
            }}
          >
            <MenuItem onClick={onDownloadAsSVG}>
              <ListItemIcon>
                <CodeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>SVG (Vector)</ListItemText>
            </MenuItem>
            <MenuItem onClick={onDownloadAsPNG}>
              <ListItemIcon>
                <ImageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>PNG Image</ListItemText>
            </MenuItem>
            <MenuItem onClick={onDownloadAsPDF}>
              <ListItemIcon>
                <PictureAsPdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>PDF Document</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loadingCertificate ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : certificateError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {certificateError}
          </Alert>
        ) : certificateData ? (
          <Box sx={{ 
            width: '100%', 
            height: '500px', 
            overflow: 'auto', 
            border: '1px solid #eee',
            p: 2,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Box 
              component="object"
              data={certificateData}
              type="image/svg+xml"
              sx={{ width: '100%', height: '100%' }}
            />
          </Box>
        ) : (
          <Typography>No certificate data available</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};