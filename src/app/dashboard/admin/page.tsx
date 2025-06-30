'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import { HelpPopover } from '@/components/ui/help-popover';
import { Users, Shield, Settings, FileText } from 'lucide-react';

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

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
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNav 
        title="Admin Panel" 
        backPath="/dashboard" 
        showBackButton={true}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="hidden md:inline-flex bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Back to Dashboard
        </button>
      </ResponsiveNav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
              <HelpPopover
                title="Admin Panel Help"
                items={[
                  {
                    title: "User Management",
                    description: "Create, edit, and manage user accounts. Control permissions and roles for secure access."
                  },
                  {
                    title: "Security Dashboard",
                    description: "Monitor system security, view audit logs, and track suspicious activities."
                  },
                  {
                    title: "System Settings",
                    description: "Configure application settings, defaults, and system-wide preferences."
                  }
                ]}
              />
            </div>
            <p className="text-gray-600">
              Manage users, system settings, and monitor application security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* User Management Card */}
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/admin/users')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and permissions
                  </CardDescription>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  • View and edit user accounts<br />
                  • Lock/unlock user accounts<br />
                  • Assign admin roles<br />
                  • Monitor user activity
                </div>
              </CardContent>
            </Card>

            {/* System Security Card */}
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/admin/security')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">Security & Audit</CardTitle>
                  <CardDescription>
                    Monitor security and audit trails
                  </CardDescription>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  • View audit logs<br />
                  • Monitor user sessions<br />
                  • Security configuration<br />
                  • System integrity checks
                </div>
              </CardContent>
            </Card>

            {/* Security Dashboard Card */}
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/admin/security')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">Security Dashboard</CardTitle>
                  <CardDescription>
                    Comprehensive security monitoring and threats
                  </CardDescription>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  • Real-time threat detection<br />
                  • Rate limiting & protection<br />
                  • Security event monitoring<br />
                  • System integrity checks
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail Card */}
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/admin/audit')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">Audit Trail</CardTitle>
                  <CardDescription>
                    Complete audit log with detailed tracking
                  </CardDescription>
                </div>
                <FileText className="h-8 w-8 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  • Complete change history<br />
                  • Advanced filtering & search<br />
                  • Export capabilities<br />
                  • Data integrity verification
                </div>
              </CardContent>
            </Card>

            {/* System Configuration Card */}
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/admin/settings')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">System Settings</CardTitle>
                  <CardDescription>
                    Configure application settings
                  </CardDescription>
                </div>
                <Settings className="h-8 w-8 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  • Application configuration<br />
                  • Default settings<br />
                  • System maintenance<br />
                  • Data management
                </div>
              </CardContent>
            </Card>

            {/* System Reports Card */}
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/admin/reports')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">System Reports</CardTitle>
                  <CardDescription>
                    System-wide analytics and reports
                  </CardDescription>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  • System usage statistics<br />
                  • Performance metrics<br />
                  • User activity reports<br />
                  • Data integrity reports
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => router.push('/test-seed')}
                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <div className="font-medium text-blue-900">Seed Test Data</div>
                  <div className="text-blue-700">Generate sample data for testing</div>
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/data-management')}
                  className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                >
                  <div className="font-medium text-green-900">Data Management</div>
                  <div className="text-green-700">Export, import, and backup data</div>
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/admin/users?filter=locked')}
                  className="w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                >
                  <div className="font-medium text-red-900">Locked Accounts</div>
                  <div className="text-red-700">View and manage locked users</div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">System Status</CardTitle>
                <CardDescription>
                  Current system health and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">Active</div>
                    <div className="text-sm text-blue-700">System Status</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Online</div>
                    <div className="text-sm text-green-700">Database</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">Secured</div>
                    <div className="text-sm text-purple-700">Authentication</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">Normal</div>
                    <div className="text-sm text-orange-700">Performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}