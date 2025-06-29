'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

export default function TestChartsPage() {
  const { data: session } = useSession();
  const [seedResult, setSeedResult] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false);

  const seedTestData = async () => {
    try {
      setIsSeeding(true);
      const response = await fetch('/api/seed-test-data', {
        method: 'POST',
      });
      
      const result = await response.json();
      setSeedResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setSeedResult(`Error: ${error}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const checkData = async () => {
    try {
      const response = await fetch('/api/test-data');
      const result = await response.json();
      setSeedResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setSeedResult(`Error: ${error}`);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to test charts</h1>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          Test Chart Functionality
        </h1>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Prepare Test Data</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            First, let's check if you have data in your database and optionally seed some test data.
          </p>
          
          <div className="flex gap-4 mb-4">
            <Button onClick={checkData} variant="outline">
              Check Current Data
            </Button>
            {session.user?.role === 'admin' && (
              <Button 
                onClick={seedTestData} 
                disabled={isSeeding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSeeding ? 'Creating Test Data...' : 'Seed Test Data'}
              </Button>
            )}
          </div>

          {seedResult && (
            <div className="bg-slate-100 dark:bg-slate-700 rounded p-4 overflow-auto">
              <pre className="text-sm">{seedResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Test Charts</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Once you have data, you can test the chart functionality:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => window.location.href = '/dashboard/reports/usage'}
              className="bg-green-600 hover:bg-green-700"
            >
              Test Usage Reports
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Testing Instructions
          </h2>
          <div className="text-blue-800 dark:text-blue-200 space-y-2">
            <p><strong>1. Seed Data:</strong> If you're an admin, click "Seed Test Data" to create sample purchases and contributions spanning 6 months.</p>
            <p><strong>2. Navigate to Reports:</strong> Click "Test Usage Reports" to access the reports page.</p>
            <p><strong>3. Test Different Views:</strong> Try switching between the 4 report types:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Monthly Usage Trends</li>
              <li>Cost Analysis Over Time</li>
              <li>Individual vs Group Usage</li>
              <li>Emergency Purchase Impact</li>
            </ul>
            <p><strong>4. Test Date Filters:</strong> Use the date range controls (This Month, Last 3 Months, All Time, or custom dates).</p>
            <p><strong>5. Test Interactive Features:</strong> Toggle between chart types, hover over data points, and explore the detailed tables.</p>
          </div>
        </div>
      </div>
    </div>
  );
}