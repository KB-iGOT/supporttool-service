import { useContext } from 'react';
import { AppContext } from '../Context/AppContext';
import { appContextType } from '../types';

/**
 * Helper function to extract the base route path from a full pathname
 * @param pathname The current pathname (e.g. "/system-settings/edit/123")
 * @returns The base path for permission checking (e.g. "/system-settings")
 */
export const getBasePath = (pathname: string): string => {
  // Extract the base route path (everything before the second slash)
  const basePathMatch = pathname.match(/^(\/[^/]+)(\/|$)/);
  let basePath = basePathMatch ? basePathMatch[1] : pathname;

  // For nested routes that might have permissions at second level
  if (pathname.split('/').length > 2) {
    const segments = pathname.split('/');
    if (segments.length >= 3) {
      const extendedBasePath = `/${segments[1]}/${segments[2]}`;
      // You might want to check if this extended path exists in permissions
      // For now we'll return the first-level path
      return basePath;
    }
  }
  
  return basePath;
};

/**
 * Custom hook to check permissions for the current module or a specific module path
 * @param specificPath Optional path to check instead of current path
 * @returns Permission object with read, write, delete access flags
 */
export const useModulePermissions = (specificPath?: string) => {
  const { modulePermissions } = useContext(AppContext) as appContextType;
  
  // Get current path if specific path not provided
  const currentPath = specificPath || window.location.pathname;
  const basePath = getBasePath(currentPath);
  
  // Get permissions for the base path
  const permissions = modulePermissions[basePath] || {};
  
  return {
    canRead: !!permissions.can_read,
    canWrite: !!permissions.can_write,
    canDelete: !!permissions.can_delete,
    permissions: permissions, // Return the full permission object too
    basePath // Return which path was used for checking
  };
};

/**
 * Function to check permissions for a specific module path
 * This is for use in non-component code where hooks can't be used
 * @param modulePermissions The modulePermissions object from context
 * @param path The path to check permissions for
 * @returns Permission object with read, write, delete access flags
 */
export const checkModulePermission = (
  modulePermissions: Record<string, any>,
  path: string
) => {
  const basePath = getBasePath(path);
  const permissions = modulePermissions[basePath] || {};
  
  return {
    canRead: !!permissions.can_read,
    canWrite: !!permissions.can_write,
    canDelete: !!permissions.can_delete,
    permissions: permissions,
    basePath
  };
};