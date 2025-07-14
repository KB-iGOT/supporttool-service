import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import PaginationIcon from '@mui/icons-material/KeyboardArrowRight';
import ClearAllIcon from '@mui/icons-material/ClearAll';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        User Management Tool: Available Actions
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Search for Users
          </Typography>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Search by Name" 
                secondary="Select 'Name' from dropdown, choose an organization, enter name, and click Search"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Search by Email" 
                secondary="Select 'Email' from dropdown, enter a valid email address, and click Search"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Search by Phone" 
                secondary="Select 'Phone' from dropdown, enter a valid phone number, and click Search"
              />
            </ListItem>
          </List>
        </Box>
        
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Filter Search Results
          </Typography>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                <FilterListIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Apply Filters" 
                secondary="Select specific values from available filters to refine your search results"
              />
            </ListItem>
          </List>
        </Box>
        
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Manage Users
          </Typography>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Edit User Profile" 
                secondary="Click the pencil icon to update user's name, email, or phone number"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Manage User Roles" 
                secondary="Click the person icon to add or remove roles for the user"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Delete Users" 
                secondary="Click the trash icon to delete the user (requires delete permission)"
              />
            </ListItem>
          </List>
        </Box>
        
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Navigate Results
          </Typography>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                <PaginationIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Pagination" 
                secondary="Change number of users per page and navigate between pages using controls at the bottom"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <ClearAllIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Clear Search" 
                secondary="Click Clear button to reset search parameters and start a new search"
              />
            </ListItem>
          </List>
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            Permission Levels
          </Typography>
          <Divider />
          <Box mt={2}>
            <Typography variant="body2" paragraph>
              Your ability to perform actions depends on your assigned permissions:
            </Typography>
            <Typography variant="body2">
              • <strong>View Permission:</strong> Search and view user details
            </Typography>
            <Typography variant="body2">
              • <strong>Write Permission:</strong> Edit user details and manage roles
            </Typography>
            <Typography variant="body2">
              • <strong>Delete Permission:</strong> Delete users from the system
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};