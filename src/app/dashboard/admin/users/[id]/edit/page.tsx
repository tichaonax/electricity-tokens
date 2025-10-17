'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import {
  Lock,
  Unlock,
  Shield,
  User,
  Mail,
  Calendar,
  Settings,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  UserPermissions,
  PERMISSION_PRESETS,
  PermissionPreset,
  mergeWithDefaultPermissions,
} from '@/types/permissions';

interface UserEditFormData {
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  locked: boolean;
  permissions: UserPermissions;
  resetPassword: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  locked: boolean;
  permissions: UserPermissions | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    userContributions: number;
    tokenPurchases: number;
  };
}

export default function EditUser() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const [formData, setFormData] = useState<UserEditFormData>({
    name: '',
    email: '',
    role: 'USER',
    locked: false,
    permissions: {
      canAddPurchases: false,
      canEditPurchases: false,
      canDeletePurchases: false,
      canAddContributions: true,
      canEditContributions: false,
      canDeleteContributions: false,
      canViewUsageReports: false,
      canViewFinancialReports: false,
      canViewEfficiencyReports: false,
      canViewPersonalDashboard: true,
      canViewCostAnalysis: false,
      canViewAccountBalance: false,
      canViewProgressiveTokenConsumption: false,
      canViewMaximumDailyConsumption: false,
      canViewPurchaseHistory: false,
      canAccessNewPurchase: false,
      canViewUserContributions: false,
      canExportData: false,
      canImportData: false,
      canCreateBackup: false,
      canAddMeterReadings: false,
    },
    resetPassword: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const userData: User = await response.json();
      setUser(userData);

      // Update form with user data
      const permissions = mergeWithDefaultPermissions(
        userData.permissions || {}
      );
      setFormData({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        locked: userData.locked,
        permissions,
        resetPassword: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUser();
    }
  }, [status, session, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Name is required');
        setSaving(false);
        return;
      }

      if (!formData.email.trim()) {
        setError('Email address is required');
        setSaving(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          locked: formData.locked,
          permissions: formData.permissions,
          resetPassword: formData.resetPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      setSuccess('User updated successfully');
      // Refresh user data
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionPreset = (preset: PermissionPreset) => {
    const presetPermissions = PERMISSION_PRESETS[preset];
    setFormData((prev) => ({ ...prev, permissions: presetPermissions }));
  };

  const updateFormField = <K extends keyof UserEditFormData>(
    field: K,
    value: UserEditFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePermission = (key: keyof UserPermissions, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: value },
    }));
  };

  const generateTemporaryPassword = () => {
    // Generate a secure 12-character temporary password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleForcePasswordResetWithTemp = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const tempPassword = generateTemporaryPassword();
      
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          generateTemporary: true,
          temporaryPassword: tempPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      setGeneratedPassword(tempPassword);
      setShowPasswordDialog(true);
      setFormData(prev => ({ ...prev, resetPassword: true }));
      setSuccess('Temporary password generated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentUser = user?.id === session?.user?.id;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ResponsiveNav
          title="Edit User"
          backPath="/dashboard/admin/users"
          showBackButton={true}
        />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error || 'User not found'}
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav
        title={`Edit ${user.name}`}
        backPath="/dashboard/admin/users"
        showBackButton={true}
        backText="Users"
      />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}


          <div className="space-y-6">
            {/* User Info Card */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5 mr-2" />
                  User Information
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Basic user account details and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Email:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Joined:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge
                    variant={
                      user.role === 'ADMIN' ? 'destructive' : 'secondary'
                    }
                  >
                    {user.role === 'ADMIN' && (
                      <Shield className="h-3 w-3 mr-1" />
                    )}
                    {user.role}
                  </Badge>
                  <Badge
                    variant={user.locked ? 'destructive' : 'default'}
                    className={
                      user.locked
                        ? ''
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }
                  >
                    {user.locked ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                        Active
                      </>
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Contributions:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {user._count.userContributions}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Purchases Created:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {user._count.tokenPurchases}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <Settings className="h-5 w-5 mr-2" />
                  Edit User Settings
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Update user account settings and permissions
                  {isCurrentUser && (
                    <span className="text-amber-600 dark:text-amber-400 ml-2">
                      (Note: Some options are disabled because this is your own
                      account)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Basic Information
                    </h4>

                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Full Name
                      </label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          updateFormField('name', e.target.value)
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          updateFormField('email', e.target.value)
                        }
                        className="w-full"
                        required
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Only administrators can change email addresses. Email must be unique.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="role"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Role
                        </label>
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) =>
                            updateFormField(
                              'role',
                              e.target.value as 'ADMIN' | 'USER'
                            )
                          }
                          disabled={isCurrentUser}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        {isCurrentUser && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            You cannot change your own role
                          </p>
                        )}
                      </div>

                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Account Locked
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Lock this user account to prevent login
                          </p>
                        </div>
                        <Switch
                          checked={formData.locked}
                          onCheckedChange={(checked) =>
                            updateFormField('locked', checked)
                          }
                          disabled={isCurrentUser}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password Reset Options
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Manage user password reset requirements
                        </p>
                      </div>
                      
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm text-gray-700 dark:text-gray-300">
                            Force Password Reset
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            User will be required to change password on next login
                          </p>
                        </div>
                        <Switch
                          checked={formData.resetPassword}
                          onCheckedChange={(checked) =>
                            updateFormField('resetPassword', checked)
                          }
                        />
                      </div>

                      <div className="pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleForcePasswordResetWithTemp}
                          disabled={saving}
                          className="w-full"
                        >
                          Generate Temporary Password
                        </Button>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Creates a temporary password and forces reset on next login
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Section - Only show for USER role */}
                  {formData.role === 'USER' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Permissions
                        </h4>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handlePermissionPreset('full-access')
                            }
                          >
                            Full Access
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePermissionPreset('default')}
                          >
                            Default
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePermissionPreset('read-only')}
                          >
                            Read Only
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Purchase Management */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            Purchase Management
                          </h5>
                          {[
                            { name: 'canAddPurchases', label: 'Add Purchases' },
                            {
                              name: 'canEditPurchases',
                              label: 'Edit Purchases',
                            },
                            {
                              name: 'canDeletePurchases',
                              label: 'Delete Purchases',
                            },
                          ].map((permission) => (
                            <div
                              key={permission.name}
                              className="flex items-center space-x-3"
                            >
                              <Switch
                                checked={
                                  formData.permissions[
                                    permission.name as keyof UserPermissions
                                  ]
                                }
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    permission.name as keyof UserPermissions,
                                    checked
                                  )
                                }
                              />
                              <label className="text-sm text-gray-700 dark:text-gray-300">
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Contribution Management */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            Contribution Management
                          </h5>
                          {[
                            {
                              name: 'canAddContributions',
                              label: 'Add Contributions',
                            },
                            {
                              name: 'canEditContributions',
                              label: 'Edit Contributions',
                            },
                            {
                              name: 'canDeleteContributions',
                              label: 'Delete Contributions',
                            },
                          ].map((permission) => (
                            <div
                              key={permission.name}
                              className="flex items-center space-x-3"
                            >
                              <Switch
                                checked={
                                  formData.permissions[
                                    permission.name as keyof UserPermissions
                                  ]
                                }
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    permission.name as keyof UserPermissions,
                                    checked
                                  )
                                }
                              />
                              <label className="text-sm text-gray-700 dark:text-gray-300">
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>


                        {/* Special Permissions */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            Special Permissions
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            These permissions control access to main dashboard features and require explicit admin approval.
                          </p>
                          {[
                            {
                              name: 'canViewPurchaseHistory',
                              label: 'View Purchase History',
                              description: 'Access to purchase history with filters'
                            },
                            {
                              name: 'canAccessNewPurchase',
                              label: 'Access New Purchase',
                              description: 'Create new token purchases'
                            },
                            {
                              name: 'canViewUserContributions',
                              label: 'View User Contributions',
                              description: 'Track usage and manage contributions'
                            },
                            {
                              name: 'canViewUsageReports',
                              label: 'View Usage Reports',
                              description: 'Access usage analytics and reports'
                            },
                            {
                              name: 'canViewFinancialReports',
                              label: 'View Financial Reports',
                              description: 'View financial summaries and reports'
                            },
                            {
                              name: 'canViewEfficiencyReports',
                              label: 'View Efficiency Reports',
                              description: 'Access efficiency analysis reports'
                            },
                            {
                              name: 'canViewCostAnalysis',
                              label: 'View Cost Analysis',
                              description: 'Access cost analysis features and insights'
                            },
                          ].map((permission) => (
                            <div
                              key={permission.name}
                              className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800"
                            >
                              <Switch
                                checked={
                                  formData.permissions[
                                    permission.name as keyof UserPermissions
                                  ]
                                }
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    permission.name as keyof UserPermissions,
                                    checked
                                  )
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {permission.label}
                                </label>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Other Permissions */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            Other Permissions
                          </h5>
                          {[
                            {
                              name: 'canViewPersonalDashboard',
                              label: 'Personal Dashboard',
                            },
                            {
                              name: 'canViewAccountBalance',
                              label: 'View Account Balance',
                            },
                            {
                              name: 'canViewProgressiveTokenConsumption',
                              label: 'View Progressive Token Consumption',
                            },
                            {
                              name: 'canViewMaximumDailyConsumption',
                              label: 'View Maximum Daily Consumption',
                            },
                            { name: 'canExportData', label: 'Export Data' },
                            { name: 'canImportData', label: 'Import Data' },
                            { name: 'canCreateBackup', label: 'Create Backups' },
                            {
                              name: 'canAddMeterReadings',
                              label: 'Add Meter Readings',
                            },
                          ].map((permission) => (
                            <div
                              key={permission.name}
                              className="flex items-center space-x-3"
                            >
                              <Switch
                                checked={
                                  formData.permissions[
                                    permission.name as keyof UserPermissions
                                  ]
                                }
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    permission.name as keyof UserPermissions,
                                    checked
                                  )
                                }
                              />
                              <label className="text-sm text-gray-700 dark:text-gray-300">
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to discard all changes?')) {
                            router.push('/dashboard/admin/users');
                          }
                        }}
                        disabled={saving}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fetchUser()}
                        disabled={saving}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button type="submit" variant="outline" disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Temporary Password Dialog */}
      {showPasswordDialog && generatedPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Temporary Password Generated
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share this temporary password with {user?.name}. They will be required to change it on their next login.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Temporary Password
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <code className="text-lg font-mono text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                    {generatedPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generatedPassword)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Save this password securely. It cannot be retrieved again and will only work until the user changes it.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setGeneratedPassword(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
