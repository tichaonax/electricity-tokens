'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  AlertTriangle, 
  Shield, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface DataResetProps {
  onResetComplete?: () => void;
}

export function DataResetComponent({ onResetComplete }: DataResetProps) {
  const [showFirstConfirmation, setShowFirstConfirmation] = useState(false);
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    details: {
      deletedCounts: { purchases: number; contributions: number };
      preservedData: { users: number };
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiredConfirmationText = 'I understand this will permanently delete all purchase and contribution data';

  const handleFirstConfirmation = () => {
    setShowFirstConfirmation(false);
    setShowSecondConfirmation(true);
  };

  const handleSecondConfirmation = async () => {
    if (confirmationText !== requiredConfirmationText) {
      setError('Confirmation text does not match. Please type the exact phrase.');
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmReset: true,
          confirmMessage: confirmationText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Data reset failed');
      }

      setResetResult(data);
      setShowSecondConfirmation(false);
      
      if (onResetComplete) {
        onResetComplete();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCancel = () => {
    setShowFirstConfirmation(false);
    setShowSecondConfirmation(false);
    setConfirmationText('');
    setError(null);
  };

  const handleStartOver = () => {
    setResetResult(null);
    setError(null);
    setConfirmationText('');
  };

  // Success result display
  if (resetResult) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Data Reset Completed
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            The system data has been successfully reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Reset Summary:</h4>
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <div>• Deleted {resetResult.details.deletedCounts.purchases} token purchases</div>
              <div>• Deleted {resetResult.details.deletedCounts.contributions} user contributions</div>
              <div>• Preserved {resetResult.details.preservedData.users} user accounts</div>
              <div>• Preserved all audit logs and session data</div>
            </div>
          </div>

          <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              This action has been logged in the audit trail for security and compliance purposes.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-2">
            <button
              onClick={handleStartOver}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Second confirmation dialog
  if (showSecondConfirmation) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Final Confirmation Required
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Please type the confirmation phrase exactly as shown below to proceed with the data reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>This action cannot be undone!</strong> All token purchases and user contributions will be permanently deleted.
            </AlertDescription>
          </Alert>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type this phrase to confirm:
            </label>
            <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md border">
              <code className="text-sm text-gray-900 dark:text-gray-100">
                {requiredConfirmationText}
              </code>
            </div>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type the confirmation phrase here..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isResetting}
            />
          </div>

          {error && (
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleSecondConfirmation}
              disabled={confirmationText !== requiredConfirmationText || isResetting}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resetting Data...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirm Data Reset
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isResetting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // First confirmation dialog
  if (showFirstConfirmation) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Confirm Data Reset
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Are you sure you want to reset all system data? This will permanently delete all token purchases and contributions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="flex items-center">
                <Trash2 className="h-3 w-3 mr-1" />
                Will Delete
              </Badge>
              <span className="text-sm text-gray-700 dark:text-gray-300">All token purchases</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="flex items-center">
                <Trash2 className="h-3 w-3 mr-1" />
                Will Delete
              </Badge>
              <span className="text-sm text-gray-700 dark:text-gray-300">All user contributions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Will Preserve
              </Badge>
              <span className="text-sm text-gray-700 dark:text-gray-300">All user accounts</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Will Preserve
              </Badge>
              <span className="text-sm text-gray-700 dark:text-gray-300">All audit logs</span>
            </div>
          </div>

          <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              This action will be logged in the audit trail and cannot be undone. You will be asked to confirm again.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-2">
            <button
              onClick={handleFirstConfirmation}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 dark:bg-yellow-700 rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600"
            >
              I Understand, Continue
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Initial state - the reset button
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <Trash2 className="h-5 w-5 mr-2 text-red-500" />
          System Data Reset
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Permanently delete all token purchases and user contributions while preserving user accounts and audit logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This action permanently deletes all financial and usage data. Use only when starting fresh or for testing purposes.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">What will be deleted:</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• All token purchases and their details</li>
            <li>• All user contributions and payment records</li>
            <li>• All purchase-contribution relationships</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">What will be preserved:</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• All user accounts and authentication data</li>
            <li>• All audit logs and system history</li>
            <li>• User sessions and app configuration</li>
          </ul>
        </div>

        <button
          onClick={() => setShowFirstConfirmation(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Reset System Data
        </button>
      </CardContent>
    </Card>
  );
}