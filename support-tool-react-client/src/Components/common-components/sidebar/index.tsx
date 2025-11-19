import { createStyles, makeStyles } from "@mui/styles";
import React, { useContext, useEffect, useState } from "react";
import { Fab, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, Tooltip, Skeleton, Box, ListItemButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { NavLink, useLocation } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import { appContextType } from "../../../types";
import {
  Group as UsersIcon,
  Article as ContentsIcon,
  ViewModule as ModulesIcon,
  Settings as SystemSettingsIcon,
  Business as OrganisationsIcon,
  Delete as DeleteOrgIcon,
  Domain,
  VerifiedUser as RolesIcon,
  ListAlt as FormsIcon,
  SupportAgent as SupportUsersIcon,
  Analytics,
  Gavel as AuditLogsIcon,
  Home as HomeIcon,
  CardMembership as CardMembershipIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  List as MasterDesignationsIcon,
  DashboardCustomize as ModuleDashboardIcon,
  Topic as TopicsIcon,
} from '@mui/icons-material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Module } from "../../../types";

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      height: "calc(100vh - 68.5px)",
      position: "fixed",
      top: '68.5px',
      backgroundColor: "#FFFFFF",
      boxShadow: "0 10px 12px 0 rgba(0,0,0,0.25)",
      zIndex: 1000,
      transition: 'width 0.2s ease-in-out',
    },
    scrollableContent: {
      height: '100%',
      overflowY: 'auto',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    },
    navLink: {
      textDecoration: 'none',
      color: 'inherit',
      display: 'block',
      '&.active': {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: '4px',
        '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
          color: '#1976d2', // Or your theme's primary color
        },
      },
    },
    listItemText: {
      display: '-webkit-box',
      '-webkit-line-clamp': 2,
      '-webkit-box-orient': 'vertical',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      wordBreak: 'break-word',
    },
  })
);

const ICONS: { [key: string]: React.ElementType } = {
  home: HomeIcon,
  'module-dashboard': ModuleDashboardIcon,
  admin: AdminPanelSettingsIcon,
  users: UsersIcon,
  contents: ContentsIcon,
  modules: ModulesIcon,
  'system-settings': SystemSettingsIcon,
  organisations: OrganisationsIcon, // Corrected key
  'org-delete': DeleteOrgIcon,
  domain: Domain,
  roles: RolesIcon,
  forms: FormsIcon,
  'support-users': SupportUsersIcon,
  analytics: Analytics,
  'audit-logs': AuditLogsIcon,
  'master-designations': MasterDesignationsIcon,
  'bulk-upload': CloudUploadIcon,
  'user-certificates': CardMembershipIcon,
  topics: TopicsIcon,
  default: DashboardIcon,
};

const getIcon = (moduleName: string) => {
  const key = moduleName.toLowerCase().replace(/\s+/g, '-');
  return ICONS[key] || ICONS.default;
};

export const Sidebar = () => {
  const { isLoggedIn, modules, loading, fetchModules, checkPermissions } = useContext(AppContext) as appContextType;
  const classes = useStyles();
  const location = useLocation();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (isLoggedIn) {
      fetchModules();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && !collapsed) {
        setCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed]);
  
  const SidebarItem = ({ module, isCollapsed, checkPermissions }: { module: Module; isCollapsed: boolean; checkPermissions: (path: string) => { canRead: boolean; canWrite: boolean; canDelete: boolean; } }) => {
    const Icon = getIcon(module.name);
    const textRef = React.useRef<HTMLElement>(null);
    const [isOverflowing, setIsOverflowing] = React.useState(false);

    React.useEffect(() => {
      const checkOverflow = () => {
        if (textRef.current) {
          setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
        }
      };

      // A small timeout helps ensure the DOM is fully rendered before checking.
      const timer = setTimeout(checkOverflow, 50);
      window.addEventListener('resize', checkOverflow);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkOverflow);
      };
    }, [isCollapsed, module.name]);

    const showTooltip = isCollapsed || isOverflowing;
    return (
      <Tooltip title={showTooltip ? module.name : ''} placement="right">
        <ListItemButton component={NavLink} to={module.url} className={classes.navLink} state={module}>
          <ListItemIcon><Icon /></ListItemIcon>
          {!isCollapsed && <ListItemText primaryTypographyProps={{ ref: textRef, className: classes.listItemText }} primary={module.name} />}
        </ListItemButton>
      </Tooltip>
    );
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (!collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  };

  // Don't render sidebar on login page
  if (location.pathname === '/login') {
    return null;
  }

  const renderModuleList = (moduleList: Module[], title: string) => (
    <>
      {!collapsed && (
        <Typography variant="overline" color="textSecondary" sx={{ pl: 2, pt: 2, display: 'block' }}>
          {title}
        </Typography>
      )}
      <List>
        {moduleList.map((module) => {
          const hasPermission = checkPermissions(module.url).canRead;
          if (!hasPermission) return null;
          return <SidebarItem key={module.id} module={module} isCollapsed={collapsed} checkPermissions={checkPermissions} />;
        })}
      </List>
    </>
  );

  return (
    isLoggedIn ?
    <div className={classes.root} style={{ width: collapsed ? "80px" : "254px" }} ref={sidebarRef}>
      <Fab variant="extended" onClick={toggleSidebar} size="small" style={{top: '50%', position: 'absolute', right: '-18px', zIndex: 1}}>
        {!collapsed && <ChevronLeftIcon fontSize="small" />}
        {collapsed && <ChevronRightIcon fontSize="small" />}
      </Fab>
      <div className={classes.scrollableContent} style={{ padding: collapsed ? '1rem 0.5rem' : '1rem' }}>
        {loading ? (
          <Box sx={{ p: 1 }}>
            {[...Array(5)].map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2, ml: 1 }} />
                {!collapsed && <Skeleton variant="text" width="80%" />}
              </Box>
            ))}
          </Box>
        ) : (
          <>
            <SidebarItem module={{ id: 'home', name: 'Home', url: '/home', description: 'Home page' }} isCollapsed={collapsed} checkPermissions={checkPermissions} />
            <SidebarItem module={{ id: 'module-dashboard', name: 'Module Dashboard', url: '/module-dashboard', description: 'Dashboard for all modules' }} isCollapsed={collapsed} checkPermissions={checkPermissions} />
            {modules.user.length > 0 && renderModuleList(modules.user, 'Modules')}
            {modules.admin.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                {renderModuleList(modules.admin, 'Admin')}
              </>
            )}
          </>
        )}
      </div>
    </div> : null
  );
};
