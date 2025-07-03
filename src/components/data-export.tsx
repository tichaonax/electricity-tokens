'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Download,
  FileText,
  Users,
  ShoppingCart,
  BarChart3,
  User,
  Loader2,
} from 'lucide-react';

interface ExportOptions {
  type: 'purchases' | 'contributions' | 'users' | 'summary' | 'purchase-data';
  format: 'csv' | 'json' | 'pdf';
  startDate?: string;
  endDate?: string;
  userId?: string;
}

interface DataExportProps {
  userRole?: string;
}

export function DataExport({ userRole }: DataExportProps) {
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    type: 'purchase-data',
    format: 'csv',
  });

  const setCurrentMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setExportOptions({
      ...exportOptions,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
    });
  };

  const setLastMonth = () => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    setExportOptions({
      ...exportOptions,
      startDate: startOfLastMonth.toISOString().split('T')[0],
      endDate: endOfLastMonth.toISOString().split('T')[0],
    });
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('type', exportOptions.type);
      params.set('format', exportOptions.format);

      if (exportOptions.startDate) {
        params.set(
          'startDate',
          new Date(exportOptions.startDate).toISOString()
        );
      }
      if (exportOptions.endDate) {
        params.set('endDate', new Date(exportOptions.endDate).toISOString());
      }
      if (exportOptions.userId) {
        params.set('userId', exportOptions.userId);
      }

      const response = await fetch(`/api/export?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export failed:', response.status, errorText);
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export_${exportOptions.type}_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportTypes: Array<{
    id: 'purchases' | 'contributions' | 'users' | 'summary' | 'purchase-data';
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'purchase-data' as const,
      name: 'Purchase Data (Recommended)',
      description: 'Combined purchases with their linked contributions',
      icon: ShoppingCart,
    },
    {
      id: 'purchases' as const,
      name: 'Token Purchases',
      description: 'All token purchases with details (legacy)',
      icon: ShoppingCart,
    },
    {
      id: 'contributions' as const,
      name: 'User Contributions',
      description: 'User contributions and meter readings (legacy)',
      icon: Users,
    },
    {
      id: 'summary' as const,
      name: 'Usage Summary',
      description: 'Aggregated user usage statistics',
      icon: BarChart3,
    },
  ];

  // Add users export for admin only
  if (userRole === 'ADMIN') {
    exportTypes.push({
      id: 'users' as const,
      name: 'Users',
      description: 'User accounts and statistics',
      icon: User,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Data Export
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Export your data in CSV or JSON format for analysis or backup
          purposes.
        </p>
      </div>

      {/* Export Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div
              key={type.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                exportOptions.type === type.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() =>
                setExportOptions({ ...exportOptions, type: type.id })
              }
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    {type.name}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Export Format
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="csv"
              checked={exportOptions.format === 'csv'}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  format: e.target.value as 'csv' | 'json' | 'pdf',
                })
              }
              className="mr-2"
            />
            <FileText className="h-4 w-4 mr-1" />
            CSV
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="json"
              checked={exportOptions.format === 'json'}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  format: e.target.value as 'csv' | 'json' | 'pdf',
                })
              }
              className="mr-2"
            />
            <FileText className="h-4 w-4 mr-1" />
            JSON
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={exportOptions.format === 'pdf'}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  format: e.target.value as 'csv' | 'json' | 'pdf',
                })
              }
              className="mr-2"
            />
            <FileText className="h-4 w-4 mr-1" />
            PDF Report
          </label>
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Date Range (Optional)
          </label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={setLastMonth}
              className="text-sm"
            >
              Export Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setCurrentMonth}
              className="text-sm"
            >
              Export This Month
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={exportOptions.startDate || ''}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  startDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={exportOptions.endDate || ''}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  endDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* User Filter for Admin */}
      {userRole === 'ADMIN' &&
        (exportOptions.type === 'contributions' ||
          exportOptions.type === 'summary') && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Specific User (Optional)
            </label>
            <input
              type="text"
              placeholder="User ID (leave empty for all users)"
              value={exportOptions.userId || ''}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  userId: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? 'Exporting...' : 'Export Data'}
        </Button>
      </div>
    </div>
  );
}
