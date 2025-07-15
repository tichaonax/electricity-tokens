'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import {
  Save,
  RefreshCw,
  Database,
  Shield,
  Zap,
} from 'lucide-react';

interface SystemSettings {
  emergencyPurchaseMultiplier: number;
  defaultTokensPerPurchase: number;
  systemMaintenanceMode: boolean;
  autoBackupEnabled: boolean;
  maxUsersPerPurchase: number;
  sessionTimeoutMinutes: number;
}

export default function SystemSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState<SystemSettings>({
    emergencyPurchaseMultiplier: 1.2,
    defaultTokensPerPurchase: 50,
    systemMaintenanceMode: false,
    autoBackupEnabled: true,
    maxUsersPerPurchase: 10,
    sessionTimeoutMinutes: 60,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSettings();
    }
  }, [status, session]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate fetching settings (in real implementation, this would be an API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, use default settings
      // In real implementation: const response = await fetch('/api/admin/settings');
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load system settings'
      );
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate settings
      if (settings.emergencyPurchaseMultiplier < 1) {
        throw new Error('Emergency purchase multiplier must be at least 1.0');
      }
      if (settings.defaultTokensPerPurchase < 1) {
        throw new Error('Default tokens per purchase must be at least 1');
      }
      if (settings.maxUsersPerPurchase < 1) {
        throw new Error('Max users per purchase must be at least 1');
      }
      if (settings.sessionTimeoutMinutes < 5) {
        throw new Error('Session timeout must be at least 5 minutes');
      }

      // Simulate saving settings
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In real implementation: await fetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });

      setSuccess('System settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    key: keyof SystemSettings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSuccess(null);
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
        title="System Settings"
        backPath="/dashboard/admin"
        showBackButton={true}
        backText="Admin"
        mobileBackText="Admin"
        showBackToDashboard={true}
        dashboardPath="/dashboard"
        dashboardText="Back to Dashboard"
      />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              System Configuration
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Configure application settings, defaults, and system behavior.
            </p>
          </div>

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
            {/* Purchase Settings */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-amber-700 dark:text-amber-400">
                  <Zap className="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400" />
                  Purchase Settings
                </CardTitle>
                <CardDescription>
                  Configure default values and behavior for token purchases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emergency Purchase Multiplier
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.emergencyPurchaseMultiplier}
                      onChange={(e) =>
                        handleInputChange(
                          'emergencyPurchaseMultiplier',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cost multiplier for emergency purchases (e.g., 1.2 = 20%
                      more expensive)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Tokens Per Purchase
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.defaultTokensPerPurchase}
                      onChange={(e) =>
                        handleInputChange(
                          'defaultTokensPerPurchase',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Default number of tokens suggested for new purchases
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Users Per Purchase
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.maxUsersPerPurchase}
                      onChange={(e) =>
                        handleInputChange(
                          'maxUsersPerPurchase',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum number of users that can contribute to a single
                      purchase
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-700 dark:text-emerald-400">
                  <Shield className="h-5 w-5 mr-2 text-emerald-500 dark:text-emerald-400" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security and session management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      handleInputChange(
                        'sessionTimeoutMinutes',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatic logout after this many minutes of inactivity
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-700 dark:text-indigo-400">
                  <Database className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system behavior and maintenance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Maintenance Mode
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      When enabled, only admins can access the system
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        'systemMaintenanceMode',
                        !settings.systemMaintenanceMode
                      )
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      settings.systemMaintenanceMode
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    disabled={loading}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.systemMaintenanceMode
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Automatic Backups
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Enable daily automatic database backups
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        'autoBackupEnabled',
                        !settings.autoBackupEnabled
                      )
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      settings.autoBackupEnabled
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    disabled={loading}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.autoBackupEnabled
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={fetchSettings}
                disabled={loading || saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                {loading ? 'Loading...' : 'Reset'}
              </button>

              <button
                onClick={handleSaveSettings}
                disabled={loading || saving}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save
                  className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`}
                />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
