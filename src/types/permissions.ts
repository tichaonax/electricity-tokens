// User Permissions System
//
// ADMIN AUTOMATIC ACCESS:
// Users with role='ADMIN' automatically have ALL permissions without needing
// explicit permission grants. This is enforced in:
// - usePermissions hook: checkPermission() returns true for admins
// - API routes: checkPermissions() utility allows admin bypass
// - Database queries: admin role checked before permission validation
//
// ADMIN_PERMISSIONS is automatically generated from DEFAULT_USER_PERMISSIONS keys
// to ensure admins always have access to all current and future permissions.
//
// PERMISSION HIERARCHY:
// 1. Admin role check (if admin, grant all access)
// 2. Custom user permissions (from database)
// 3. Default permissions (fallback for new users)
//
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
  canCreateBackup: boolean;

  // Receipt Data Management (ET-100)
  canCreatePurchase: boolean; // Create new purchase with receipt data
  canAddReceiptData: boolean; // Add receipt data to existing purchase
  canEditReceiptData: boolean; // Edit existing receipt data
  canDeleteReceiptData: boolean; // Delete receipt data
  canImportHistoricalReceipts: boolean; // Bulk import historical receipts via CSV
  canViewDualCurrencyAnalysis: boolean; // View dual-currency charts and insights
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
  canCreateBackup: false,

  // Receipt Data Management (ET-100) - Limited access by default
  canCreatePurchase: true, // Allow users to create purchases with receipts
  canAddReceiptData: false, // Restricted: adding receipt to existing purchase
  canEditReceiptData: false, // Restricted: editing receipts
  canDeleteReceiptData: false, // Restricted: deleting receipts
  canImportHistoricalReceipts: false, // Restricted: bulk import requires permission
  canViewDualCurrencyAnalysis: true, // Allow viewing dual-currency insights
};

// Full permissions for admin users - AUTOMATICALLY GENERATED
// This ensures admins always have ALL permissions without manual maintenance
export const ADMIN_PERMISSIONS: UserPermissions = Object.keys(DEFAULT_USER_PERMISSIONS).reduce(
  (acc, key) => {
    acc[key as keyof UserPermissions] = true;
    return acc;
  },
  {} as UserPermissions
);

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
  canCreateBackup: false,

  // Receipt Data Management (ET-100) - No access for read-only
  canCreatePurchase: false,
  canAddReceiptData: false,
  canEditReceiptData: false,
  canDeleteReceiptData: false,
  canImportHistoricalReceipts: false,
  canViewDualCurrencyAnalysis: false,
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
  canCreateBackup: false,

  // Receipt Data Management (ET-100) - Limited for contributors
  canCreatePurchase: false, // Contributors cannot create purchases
  canAddReceiptData: false,
  canEditReceiptData: false,
  canDeleteReceiptData: false,
  canImportHistoricalReceipts: false,
  canViewDualCurrencyAnalysis: true, // Allow viewing insights
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
  'full-access': ADMIN_PERMISSIONS, // Note: This is automatically generated for admins
  default: DEFAULT_USER_PERMISSIONS,
  'read-only': READ_ONLY_PERMISSIONS,
  'contributor-only': CONTRIBUTOR_ONLY_PERMISSIONS,
} as const;

export type PermissionPreset = keyof typeof PERMISSION_PRESETS;
