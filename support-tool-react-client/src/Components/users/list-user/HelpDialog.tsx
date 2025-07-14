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
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import PaginationIcon from '@mui/icons-material/KeyboardArrowRight';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import AddIcon from '@mui/icons-material/Add';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';

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
        {/* User Creation Section */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Create Users
          </Typography>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Create New User" 
                secondary="Click the 'Create User' button in the top right to add a new user to the system"
              />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ pl: 9, mt: -1, color: 'text.secondary' }}>
            Required information includes full name, email address, phone number, department/organization, and user roles
          </Typography>
        </Box>

        {/* Search Section */}
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
        
        {/* Filter Section */}
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
        
        {/* User Management Section - Enhanced with all options */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Manage Users
          </Typography>
          <Divider />
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Available User Actions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List disablePadding>
                <ListItem>
                  <ListItemIcon>
                    <EditIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Edit User Profile" 
                    secondary="Update user's name, email, or phone number"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Manage User Roles" 
                    secondary="Add or remove roles for the user within their organization"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CompareArrowsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Migrate User" 
                    secondary="Move user to a different organization with options for data handling"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CardMembershipIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Re-issue Certificate" 
                    secondary="Re-generate and download certificates for the user"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DeleteIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Delete Users" 
                    secondary="Remove the user from the system (requires delete permission)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LockResetIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Reset Password" 
                    secondary="Generate a password reset link for users who need to reset their password"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BlockIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Block/Unblock Users" 
                    secondary="Restrict or restore user access to the platform"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Migration Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                When migrating a user to a new organization, you have several options:
              </Typography>
              <Typography variant="body2">
                • <strong>Force Migration:</strong> Overwrite any existing data conflicts during migration
              </Typography>
              <Typography variant="body2">
                • <strong>Soft Delete from Old Organization:</strong> Remove user from old organization while preserving their data
              </Typography>
              <Typography variant="body2">
                • <strong>Send Notification:</strong> Notify the user about their migration to a new organization
              </Typography>
              <Typography variant="body2" color="warning.main" mt={1}>
                <strong>Note:</strong> Migration affects user's access permissions and content associations.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Role Management</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Users can have one or more of the following roles:
              </Typography>
              <Typography variant="body2">
                • <strong>PUBLIC:</strong> Basic user access with limited permissions
              </Typography>
              <Typography variant="body2">
                • <strong>CONTENT_CREATOR:</strong> Can create and edit content
              </Typography>
              <Typography variant="body2">
                • <strong>CONTENT_REVIEWER:</strong> Can review and approve content
              </Typography>
              <Typography variant="body2">
                • <strong>ORG_ADMIN:</strong> Administrative privileges within their organization
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
        
        {/* Navigation Section */}
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
        
        {/* Permissions Section */}
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
              • <strong>Write Permission:</strong> Create users, edit details, manage roles, and migrate users
            </Typography>
            <Typography variant="body2">
              • <strong>Delete Permission:</strong> Remove users from the system
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