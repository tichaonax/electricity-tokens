'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DataExport } from '@/components/data-export';
import { DataImport } from '@/components/data-import';
import { DataBackup } from '@/components/data-backup';
import { ArrowLeft, Download, Upload, Shield, HardDrive } from 'lucide-react';
import { NavigationFormButton } from '@/components/ui/navigation-form-button';
import { navigateToDashboard } from '@/app/actions/navigation';

export function DataManagementClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup'>(
    'export'
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = session.user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <NavigationFormButton
                action={navigateToDashboard}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </NavigationFormButton>
              <div className="flex items-center gap-2 ml-8">
                <Shield className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  Data Management
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-700 dark:text-slate-300">
                {session.user?.name}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({session.user?.role})
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Data Export & Import
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Export your data for analysis, import bulk data from CSV files, or
              create database backups.
              {!isAdmin &&
                ' Import and backup functionality requires administrator privileges.'}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('export')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'export'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Export Data
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  disabled={!isAdmin}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'import' && isAdmin
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : !isAdmin
                        ? 'border-transparent text-slate-300 cursor-not-allowed dark:text-slate-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  Import Data
                  {!isAdmin && (
                    <span className="ml-1 text-xs">(Admin Only)</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('backup')}
                  disabled={!isAdmin}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'backup' && isAdmin
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : !isAdmin
                        ? 'border-transparent text-slate-300 cursor-not-allowed dark:text-slate-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <HardDrive className="h-4 w-4 inline mr-2" />
                  Backup & Restore
                  {!isAdmin && (
                    <span className="ml-1 text-xs">(Admin Only)</span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg dark:bg-slate-800 p-6">
            {activeTab === 'export' && (
              <DataExport userRole={session.user?.role} />
            )}

            {activeTab === 'import' && (
              <>
                {isAdmin ? (
                  <DataImport />
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Administrator Access Required
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Data import functionality is restricted to administrators
                      only. Please contact your system administrator for
                      assistance.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'backup' && (
              <>
                {isAdmin ? (
                  <DataBackup />
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Administrator Access Required
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Backup and restore functionality is restricted to
                      administrators only. Please contact your system
                      administrator for assistance.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 dark:bg-blue-950 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Data Management Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Export Best Practices
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Use date filters to export specific time periods</li>
                  <li>• CSV format is recommended for spreadsheet analysis</li>
                  <li>• JSON format preserves exact data structure</li>
                  <li>• PDF format creates professional reports</li>
                  <li>• Regular exports can serve as data backups</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Import Guidelines
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Always validate data before importing</li>
                  <li>• Ensure CSV headers match expected format</li>
                  <li>• Import creates or updates existing records</li>
                  <li>• Backup existing data before large imports</li>
                  <li>• Use preview feature to check data quality</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Backup & Restore
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Create regular full database backups</li>
                  <li>• Store backups in secure, separate locations</li>
                  <li>• Test restore procedures periodically</li>
                  <li>• Backup before major data operations</li>
                  <li>• Document backup and restore procedures</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}