'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import {
  Users,
  Lock,
  Unlock,
  Shield,
  UserX,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import {
  UserPermissions,
  PERMISSION_PRESETS,
  PermissionPreset,
  mergeWithDefaultPermissions,
} from '@/types/permissions';

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
    contributions: number;
    createdPurchases: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function UserManagementContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [lockedFilter, setLockedFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Permissions management states
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] =
    useState<UserPermissions | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    // Get initial filter from URL params
    const filter = searchParams.get('filter');
    if (filter === 'locked') {
      setLockedFilter('true');
    }
  }, [searchParams]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
      });

      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      if (lockedFilter !== 'all') {
        params.append('locked', lockedFilter);
      }
      if (searchFilter.trim()) {
        params.append('search', searchFilter.trim());
      }

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pagination.limit, roleFilter, lockedFilter, searchFilter]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [
    status,
    session,
    currentPage,
    roleFilter,
    lockedFilter,
    searchFilter,
    fetchUsers,
  ]);

  const handleUserAction = async (
    userId: string,
    action: 'lock' | 'unlock' | 'promote' | 'demote' | 'delete'
  ) => {
    try {
      setActionLoading(userId);
      setError(null);

      let requestData: Record<string, unknown> = {};
      let method = 'PUT';

      switch (action) {
        case 'lock':
          requestData = { locked: true };
          break;
        case 'unlock':
          requestData = { locked: false };
          break;
        case 'promote':
          requestData = { role: 'ADMIN' };
          break;
        case 'demote':
          requestData = { role: 'USER' };
          break;
        case 'delete':
          method = 'DELETE';
          break;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method,
        headers: method === 'PUT' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'PUT' ? JSON.stringify(requestData) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Action failed');
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setEditingPermissions(mergeWithDefaultPermissions(user.permissions || {}));
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !editingPermissions) return;

    try {
      setActionLoading(selectedUser.id);
      setError(null);

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editingPermissions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update permissions');
      }

      await fetchUsers();
      setShowPermissionsModal(false);
      setSelectedUser(null);
      setEditingPermissions(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update permissions'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermissionPreset = (preset: PermissionPreset) => {
    if (editingPermissions) {
      setEditingPermissions(PERMISSION_PRESETS[preset]);
    }
  };

  const updatePermission = (key: keyof UserPermissions, value: boolean) => {
    if (editingPermissions) {
      setEditingPermissions({
        ...editingPermissions,
        [key]: value,
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav
        title="User Management"
        backPath="/dashboard/admin"
        showBackButton={true}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="hidden md:inline-flex bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Back to Dashboard
        </button>
      </ResponsiveNav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              User Account Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage user accounts, roles, and permissions for the electricity
              tokens system.
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Search Users
                    </label>
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Name or email..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="USER">User</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Status
                    </label>
                    <select
                      value={lockedFilter}
                      onChange={(e) => setLockedFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Accounts</option>
                      <option value="false">Active</option>
                      <option value="true">Locked</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                <Users className="h-5 w-5 mr-2" />
                Users ({pagination.total})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Showing {users.length} of {pagination.total} users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No users found matching your criteria.
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                user.role === 'ADMIN'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {user.role === 'ADMIN' && (
                                <Shield className="h-3 w-3 mr-1" />
                              )}
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div>{user._count.contributions} contributions</div>
                            <div>{user._count.createdPurchases} purchases</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {user.id !== session.user?.id && (
                              <>
                                {user.locked ? (
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, 'unlock')
                                    }
                                    disabled={actionLoading === user.id}
                                    className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50"
                                    title="Unlock Account"
                                  >
                                    <Unlock className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, 'lock')
                                    }
                                    disabled={actionLoading === user.id}
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                                    title="Lock Account"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </button>
                                )}

                                {user.role === 'USER' ? (
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, 'promote')
                                    }
                                    disabled={actionLoading === user.id}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 disabled:opacity-50"
                                    title="Promote to Admin"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, 'demote')
                                    }
                                    disabled={actionLoading === user.id}
                                    className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 disabled:opacity-50"
                                    title="Demote to User"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                )}

                                {/* Permissions Button - Only for regular users */}
                                {user.role === 'USER' && (
                                  <button
                                    onClick={() => handleEditPermissions(user)}
                                    disabled={actionLoading === user.id}
                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 disabled:opacity-50"
                                    title="Edit Permissions"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </button>
                                )}

                                {user._count.contributions === 0 &&
                                  user._count.createdPurchases === 0 && (
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Are you sure you want to delete ${user.name}? This action cannot be undone.`
                                          )
                                        ) {
                                          handleUserAction(user.id, 'delete');
                                        }
                                      }}
                                      disabled={actionLoading === user.id}
                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                                      title="Delete User"
                                    >
                                      <UserX className="h-4 w-4" />
                                    </button>
                                  )}
                              </>
                            )}
                            {actionLoading === user.id && (
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-sm bg-indigo-50 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 rounded-md text-indigo-900 dark:text-indigo-100">
                      {pagination.page}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && editingPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Permissions for {selectedUser.name}
              </h3>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Permission Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Presets:
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePermissionPreset('full-access')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  Full Access
                </button>
                <button
                  onClick={() => handlePermissionPreset('default')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  Default User
                </button>
                <button
                  onClick={() => handlePermissionPreset('read-only')}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  Read Only
                </button>
                <button
                  onClick={() => handlePermissionPreset('contributor-only')}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
                >
                  Contributor Only
                </button>
              </div>
            </div>

            {/* Individual Permissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Purchase Management */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Purchase Management
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'canAddPurchases', label: 'Add Purchases' },
                    { key: 'canEditPurchases', label: 'Edit Purchases' },
                    { key: 'canDeletePurchases', label: 'Delete Purchases' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          editingPermissions[key as keyof UserPermissions]
                        }
                        onChange={(e) =>
                          updatePermission(
                            key as keyof UserPermissions,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contribution Management */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Contribution Management
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'canAddContributions', label: 'Add Contributions' },
                    {
                      key: 'canEditContributions',
                      label: 'Edit Contributions',
                    },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          editingPermissions[key as keyof UserPermissions]
                        }
                        onChange={(e) =>
                          updatePermission(
                            key as keyof UserPermissions,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reports Access */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Reports Access
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'canViewUsageReports', label: 'Usage Reports' },
                    {
                      key: 'canViewFinancialReports',
                      label: 'Financial Reports',
                    },
                    {
                      key: 'canViewEfficiencyReports',
                      label: 'Efficiency Reports',
                    },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          editingPermissions[key as keyof UserPermissions]
                        }
                        onChange={(e) =>
                          updatePermission(
                            key as keyof UserPermissions,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Personal Dashboard */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Personal Dashboard
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      key: 'canViewPersonalDashboard',
                      label: 'Personal Dashboard',
                    },
                    { key: 'canViewCostAnalysis', label: 'Cost Analysis' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          editingPermissions[key as keyof UserPermissions]
                        }
                        onChange={(e) =>
                          updatePermission(
                            key as keyof UserPermissions,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Management */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Data Management
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'canExportData', label: 'Export Data' },
                    { key: 'canImportData', label: 'Import Data' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          editingPermissions[key as keyof UserPermissions]
                        }
                        onChange={(e) =>
                          updatePermission(
                            key as keyof UserPermissions,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 border border-transparent rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserManagement() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <UserManagementContent />
    </Suspense>
  );
}
