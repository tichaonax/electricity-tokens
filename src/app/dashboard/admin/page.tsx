'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import { HelpPopover } from '@/components/ui/help-popover';
import { Users, Shield, Settings, FileText, Activity, Trash2, Gauge } from 'lucide-react';
import { DataResetComponent } from '@/components/admin/data-reset';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
              <HelpPopover
                title="Admin Panel Help"
                items={[
                  {
                    title: 'User Management',
                    description:
                      'Create, edit, and manage user accounts. Control permissions and roles for secure access.',
                  },
                  {
                    title: 'Security Dashboard',
                    description:
                      'Monitor system security, view audit logs, and track suspicious activities.',
                  },
                  {
                    title: 'System Settings',
                    description:
                      'Configure application settings, defaults, and system-wide preferences.',
                  },
                ]}
              />
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Manage users, system settings, and monitor application security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* User Management Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/admin/users')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and permissions
                  </CardDescription>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • View and edit user accounts
                  <br />
                  • Lock/unlock user accounts
                  <br />
                  • Assign admin roles
                  <br />• Monitor user activity
                </div>
              </CardContent>
            </Card>

            {/* System Security Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/admin/security')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Security & Audit
                  </CardTitle>
                  <CardDescription>
                    Monitor security and audit trails
                  </CardDescription>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • View audit logs
                  <br />
                  • Monitor user sessions
                  <br />
                  • Security configuration
                  <br />• System integrity checks
                </div>
              </CardContent>
            </Card>

            {/* Security Dashboard Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/admin/security')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Security Dashboard
                  </CardTitle>
                  <CardDescription>
                    Comprehensive security monitoring and threats
                  </CardDescription>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • Real-time threat detection
                  <br />
                  • Rate limiting & protection
                  <br />
                  • Security event monitoring
                  <br />• System integrity checks
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/admin/audit')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Audit Trail
                  </CardTitle>
                  <CardDescription>
                    Complete audit log with detailed tracking
                  </CardDescription>
                </div>
                <FileText className="h-8 w-8 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • Complete change history
                  <br />
                  • Advanced filtering & search
                  <br />
                  • Export capabilities
                  <br />• Data integrity verification
                </div>
              </CardContent>
            </Card>

            {/* System Configuration Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/admin/settings')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    System Settings
                  </CardTitle>
                  <CardDescription>
                    Configure application settings
                  </CardDescription>
                </div>
                <Settings className="h-8 w-8 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • Application configuration
                  <br />
                  • Default settings
                  <br />
                  • System maintenance
                  <br />• Data management
                </div>
              </CardContent>
            </Card>

            {/* Meter Readings Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/meter-readings')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    Meter Readings
                  </CardTitle>
                  <CardDescription>
                    Manage daily electricity meter readings
                  </CardDescription>
                </div>
                <Gauge className="h-8 w-8 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • View meter reading history
                  <br />
                  • Add new meter readings
                  <br />
                  • Validate consumption data
                  <br />• Track usage patterns
                </div>
              </CardContent>
            </Card>

            {/* System Reports Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/admin/reports')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    System Reports
                  </CardTitle>
                  <CardDescription>
                    System-wide analytics and reports
                  </CardDescription>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • System usage statistics
                  <br />
                  • Performance metrics
                  <br />
                  • User activity reports
                  <br />• Data integrity reports
                </div>
              </CardContent>
            </Card>

            {/* System Monitoring Card */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push('/dashboard/admin/monitoring')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    System Monitoring
                  </CardTitle>
                  <CardDescription>
                    Real-time system health and performance
                  </CardDescription>
                </div>
                <Activity className="h-8 w-8 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  • System health checks
                  <br />
                  • Database performance
                  <br />
                  • Error tracking
                  <br />• Analytics dashboard
                </div>
              </CardContent>
            </Card>

            {/* System Data Reset Card */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium text-red-700 dark:text-red-400">
                    Data Reset
                  </CardTitle>
                  <CardDescription>
                    Reset all purchase and contribution data
                  </CardDescription>
                </div>
                <Trash2 className="h-8 w-8 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <strong>What will be deleted:</strong>
                  <br />
                  • All token purchases and their details
                  <br />
                  • All user contributions and payment records
                  <br />
                  • All meter readings and consumption data
                  <br />
                  • All purchase-contribution relationships
                  <br /><br />
                  <strong>What will be preserved:</strong>
                  <br />
                  • User accounts and login credentials
                  <br />
                  • System audit logs and activity history
                </div>
                <DataResetComponent />
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="md:col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Quick Actions
                </CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => router.push('/test-seed')}
                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                >
                  <div className="font-medium text-blue-900 dark:text-blue-200">
                    Seed Test Data
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    Generate sample data for testing
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/data-management')}
                  className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-md transition-colors"
                >
                  <div className="font-medium text-green-900 dark:text-green-200">
                    Data Management
                  </div>
                  <div className="text-green-700 dark:text-green-300">
                    Export, import, and backup data
                  </div>
                </button>

                <button
                  onClick={() =>
                    router.push('/dashboard/admin/users?filter=locked')
                  }
                  className="w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-md transition-colors"
                >
                  <div className="font-medium text-red-900 dark:text-red-200">
                    Locked Accounts
                  </div>
                  <div className="text-red-700 dark:text-red-300">
                    View and manage locked users
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="mt-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  System Status
                </CardTitle>
                <CardDescription>
                  Current system health and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      Active
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">System Status</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      Online
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Database</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      Secured
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Authentication
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      Normal
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">Performance</div>
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
