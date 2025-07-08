// User Permissions System
export interface UserPermissions {
  // Purchase Management
  canAddPurchases: boolean;
  canEditPurchases: boolean;
  canDeletePurchases: boolean;

  // Contribution Management
  canAddContributions: boolean;
  canEditContributions: boolean;
  canDeleteContributions: boolean;

  // Meter Reading Management
  canAddMeterReadings: boolean;

  // Reports Access
  canViewUsageReports: boolean;
  canViewFinancialReports: boolean;
  canViewEfficiencyReports: boolean;

  // Personal Dashboard
  canViewPersonalDashboard: boolean;
  canViewCostAnalysis: boolean;
  canViewAccountBalance: boolean;
  canViewProgressiveTokenConsumption: boolean;
  canViewMaximumDailyConsumption: boolean;

  // Dashboard Access Control
  canViewPurchaseHistory: boolean;
  canAccessNewPurchase: boolean;
  canViewUserContributions: boolean;

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
  canDeleteContributions: false,

  // Meter Reading Management - No access by default
  canAddMeterReadings: false,

  // Reports Access - Special permissions (not included by default)
  canViewUsageReports: false, // Usage reports - special permission
  canViewFinancialReports: false, // Financial reports - special permission
  canViewEfficiencyReports: false, // Efficiency reports - special permission

  // Personal Dashboard - Limited access for regular users
  canViewPersonalDashboard: true,
  canViewCostAnalysis: false, // Cost analysis - special permission
  canViewAccountBalance: false, // Account balance restricted by default
  canViewProgressiveTokenConsumption: false, // Progressive consumption widget restricted by default
  canViewMaximumDailyConsumption: false, // Maximum daily consumption widget restricted by default

  // Dashboard Access Control - Special permissions (not included by default)
  canViewPurchaseHistory: false, // Purchase history access - special permission
  canAccessNewPurchase: false, // New purchase creation - special permission
  canViewUserContributions: false, // User contributions view - special permission

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
  canDeleteContributions: true,
  canAddMeterReadings: true,
  canViewUsageReports: true,
  canViewFinancialReports: true,
  canViewEfficiencyReports: true,
  canViewPersonalDashboard: true,
  canViewCostAnalysis: true,
  canViewAccountBalance: true,
  canViewProgressiveTokenConsumption: true,
  canViewMaximumDailyConsumption: true,
  canViewPurchaseHistory: true,
  canAccessNewPurchase: true,
  canViewUserContributions: true,
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
  canDeleteContributions: false,
  canAddMeterReadings: false,
  canViewUsageReports: false, // Special permission - not included in read-only
  canViewFinancialReports: false, // Special permission - not included in read-only
  canViewEfficiencyReports: false, // Special permission - not included in read-only
  canViewPersonalDashboard: true,
  canViewCostAnalysis: false, // Special permission - not included in read-only
  canViewAccountBalance: false, // Restricted access to balance
  canViewProgressiveTokenConsumption: false, // Restricted access to progressive consumption
  canViewMaximumDailyConsumption: false, // Restricted access to maximum daily consumption
  canViewPurchaseHistory: false, // Special permission - not included in read-only
  canAccessNewPurchase: false, // Special permission - not included in read-only
  canViewUserContributions: false, // Special permission - not included in read-only
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
  canDeleteContributions: false,
  canAddMeterReadings: false,
  canViewUsageReports: false, // Special permission - not included for contributors
  canViewFinancialReports: false, // Special permission - not included for contributors
  canViewEfficiencyReports: false, // Special permission - not included for contributors
  canViewPersonalDashboard: true,
  canViewCostAnalysis: false, // Special permission - not included for contributors
  canViewAccountBalance: false, // No balance access for contributors
  canViewProgressiveTokenConsumption: false, // No progressive consumption access for contributors
  canViewMaximumDailyConsumption: false, // No maximum daily consumption access for contributors
  canViewPurchaseHistory: false, // Special permission - not included for contributors
  canAccessNewPurchase: false, // Special permission - not included for contributors
  canViewUserContributions: true, // Allow contributions view for contributors (special grant)
  canExportData: false,
  canImportData: false,
};

// Helper function to merge permissions with defaults
export function mergeWithDefaultPermissions(
  userPermissions?: Partial<UserPermissions>
): UserPermissions {
  return {
    ...DEFAULT_USER_PERMISSIONS,
    ...userPermissions,
  };
}

// Helper function to check if user has specific permission
export function hasPermission(
  userPermissions: UserPermissions | null | undefined,
  permission: keyof UserPermissions
): boolean {
  if (!userPermissions) return false;
  return userPermissions[permission] === true;
}

// Permission groups for easy admin selection
export const PERMISSION_PRESETS = {
  'full-access': ADMIN_PERMISSIONS,
  default: DEFAULT_USER_PERMISSIONS,
  'read-only': READ_ONLY_PERMISSIONS,
  'contributor-only': CONTRIBUTOR_ONLY_PERMISSIONS,
} as const;

export type PermissionPreset = keyof typeof PERMISSION_PRESETS;
