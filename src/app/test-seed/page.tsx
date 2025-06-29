'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function TestSeedPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const seedData = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/seed-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to seed data');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Test Data Seeding</h1>
        <p>Please sign in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Test Data Seeding</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Signed in as: <strong>{session.user?.name}</strong> ({session.user?.role})
          </p>
          {session.user?.role !== 'admin' && (
            <p className="text-red-600 text-sm">
              Note: Admin access required to seed test data
            </p>
          )}
        </div>

        <button
          onClick={seedData}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md mb-4"
        >
          {loading ? 'Seeding Data...' : 'Seed Test Data'}
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success:</strong> {result.message}
            {result.summary && (
              <div className="mt-2">
                <h3 className="font-semibold">Summary:</h3>
                <ul className="list-disc list-inside">
                  <li>Users: {result.summary.users}</li>
                  <li>Purchases: {result.summary.purchases}</li>
                  <li>Contributions: {result.summary.contributions}</li>
                  <li>Emergency Purchases: {result.summary.emergencyPurchases}</li>
                  <li>Regular Purchases: {result.summary.regularPurchases}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h2 className="font-semibold mb-2">What this does:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Creates 4 test users (Alice, Bob, Carol, David)</li>
          <li>Generates 6 months of purchase history</li>
          <li>Creates 2-4 purchases per month with varying amounts</li>
          <li>30% chance of emergency purchases (higher rates)</li>
          <li>Distributes token consumption among users</li>
        </ul>
      </div>
    </div>
  );
}