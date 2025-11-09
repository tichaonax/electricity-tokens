import { useSession } from 'next-auth/react';
import { UserPermissions, hasPermission, mergeWithDefaultPermissions, ADMIN_PERMISSIONS } from '@/types/permissions';

/**
 * Custom hook for checking user permissions
 * 
 * IMPORTANT: Admins automatically have ALL permissions without needing explicit grants.
 * The checkPermission() function returns true for any permission if user role is 'ADMIN'.
 * 
 * @returns {Object} Permission utilities
 * @returns {UserPermissions} permissions - All permissions for current user
 * @returns {Function} checkPermission - Check if user has specific permission (always true for admins)
 * @returns {boolean} isAdmin - Whether current user is an admin
 * @returns {boolean} isAuthenticated - Whether user is authenticated
 */
export function usePermissions() {
  const { data: session } = useSession();
  
  // Get user permissions, with fallback to defaults
  const getUserPermissions = (): UserPermissions => {
    if (!session?.user) {
      // Return empty permissions for non-authenticated users
      return {} as UserPermissions;
    }
    
    // Admins get all permissions
    if (session.user.role === 'ADMIN') {
      return ADMIN_PERMISSIONS;
    }
    
    // Regular users get their custom permissions or defaults
    const userPermissions = session.user.permissions as UserPermissions | null;
    return mergeWithDefaultPermissions(userPermissions || {});
  };
  
  // Check if user has a specific permission
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    if (!session?.user) return false;
    
    // Admins always have all permissions
    if (session.user.role === 'ADMIN') {
      return true;
    }
    
    const permissions = getUserPermissions();
    return hasPermission(permissions, permission);
  };
  
  // Get all permissions for the current user
  const permissions = getUserPermissions();
  
  return {
    permissions,
    checkPermission,
    isAdmin: session?.user?.role === 'ADMIN',
    isAuthenticated: !!session?.user,
  };
}