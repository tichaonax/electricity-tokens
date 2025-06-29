// User Permissions System
export interface UserPermissions {
  // Purchase Management
  canAddPurchases: boolean;
  canEditPurchases: boolean;
  canDeletePurchases: boolean;
  
  // Contribution Management
  canAddContributions: boolean;
  canEditContributions: boolean;
  
  // Reports Access
  canViewUsageReports: boolean;
  canViewFinancialReports: boolean;
  canViewEfficiencyReports: boolean;
  
  // Personal Dashboard
  canViewPersonalDashboard: boolean;
  canViewCostAnalysis: boolean;
  
  // Data Management
  canExportData: boolean;
  canImportData: boolean;
}

// Default permissions for new users
export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  // Purchase Management - Limited by default
  canAddPurchases: true,
  canEditPurchases: false,
  canDeletePurchases: false,
  
  // Contribution Management - Full access
  canAddContributions: true,
  canEditContributions: true,
  
  // Reports Access - Basic access
  canViewUsageReports: true,
  canViewFinancialReports: true,
  canViewEfficiencyReports: false,
  
  // Personal Dashboard - Full access
  canViewPersonalDashboard: true,
  canViewCostAnalysis: true,
  
  // Data Management - No access by default
  canExportData: false,
  canImportData: false,
};

// Full permissions for admin users
export const ADMIN_PERMISSIONS: UserPermissions = {
  canAddPurchases: true,
  canEditPurchases: true,
  canDeletePurchases: true,
  canAddContributions: true,
  canEditContributions: true,
  canViewUsageReports: true,
  canViewFinancialReports: true,
  canViewEfficiencyReports: true,
  canViewPersonalDashboard: true,
  canViewCostAnalysis: true,
  canExportData: true,
  canImportData: true,
};

// Restricted permissions preset (read-only user)
export const READ_ONLY_PERMISSIONS: UserPermissions = {
  canAddPurchases: false,
  canEditPurchases: false,
  canDeletePurchases: false,
  canAddContributions: false,
  canEditContributions: false,
  canViewUsageReports: true,
  canViewFinancialReports: true,
  canViewEfficiencyReports: false,
  canViewPersonalDashboard: true,
  canViewCostAnalysis: true,
  canExportData: false,
  canImportData: false,
};

// Contributor-only permissions preset
export const CONTRIBUTOR_ONLY_PERMISSIONS: UserPermissions = {
  canAddPurchases: false,
  canEditPurchases: false,
  canDeletePurchases: false,
  canAddContributions: true,
  canEditContributions: true,
  canViewUsageReports: false,
  canViewFinancialReports: false,
  canViewEfficiencyReports: false,
  canViewPersonalDashboard: true,
  canViewCostAnalysis: false,
  canExportData: false,
  canImportData: false,
};

// Helper function to merge permissions with defaults
export function mergeWithDefaultPermissions(userPermissions?: Partial<UserPermissions>): UserPermissions {
  return {
    ...DEFAULT_USER_PERMISSIONS,
    ...userPermissions,
  };
}

// Helper function to check if user has specific permission
export function hasPermission(userPermissions: UserPermissions | null | undefined, permission: keyof UserPermissions): boolean {
  if (!userPermissions) return false;
  return userPermissions[permission] === true;
}

// Permission groups for easy admin selection
export const PERMISSION_PRESETS = {
  'full-access': ADMIN_PERMISSIONS,
  'default': DEFAULT_USER_PERMISSIONS,
  'read-only': READ_ONLY_PERMISSIONS,
  'contributor-only': CONTRIBUTOR_ONLY_PERMISSIONS,
} as const;

export type PermissionPreset = keyof typeof PERMISSION_PRESETS;