'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Zap, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

interface Purchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  purchaseDate: string;
  isEmergency: boolean;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  contribution?: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  } | null;
  createdAt: string;
}

export default function PurchasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPurchases();
    }
  }, [session]);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/purchases');

      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (error) {
      // console.error removed
      setError(
        error instanceof Error ? error.message : 'Failed to load purchases'
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between min-h-16 py-2">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
              >
                <span className="hidden sm:inline">← Back to Dashboard</span>
                <span className="sm:hidden">← Dashboard</span>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <Zap className="h-5 w-5 text-blue-600 flex-shrink-0" />
                Token Purchases
              </h1>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
              <Button
                onClick={() => router.push('/dashboard/purchases/new')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white text-sm sm:text-base"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Purchase</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">
                Loading purchases...
              </span>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                No purchases
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Get started by creating your first token purchase.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push('/dashboard/purchases/new')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                  <Plus className="h-4 w-4" />
                  New Purchase
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow dark:bg-slate-800 overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {purchases.map((purchase) => (
                  <li key={purchase.id}>
                    <div className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {purchase.isEmergency ? (
                              <AlertTriangle className="h-6 w-6 text-amber-500" />
                            ) : (
                              <Zap className="h-6 w-6 text-blue-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {purchase.totalTokens.toLocaleString()} tokens
                              </p>
                              {purchase.isEmergency && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                  Emergency
                                </span>
                              )}
                            </div>
                            <div className="flex items-center mt-1 text-sm text-slate-500 dark:text-slate-400">
                              <DollarSign className="h-4 w-4 mr-1" />$
                              {purchase.totalPayment.toFixed(2)}
                              <span className="mx-2">•</span>
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(
                                purchase.purchaseDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 sm:text-right">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                            <div className="sm:text-right">
                              <p className="text-sm text-slate-900 dark:text-slate-100">
                                $
                                {(
                                  purchase.totalPayment / purchase.totalTokens
                                ).toFixed(4)}
                                /token
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                by {purchase.creator.name}
                              </p>
                            </div>
                            {purchase.contribution ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/contributions#contribution-${purchase.contribution!.id}`);
                                }}
                                className="text-xs dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 w-full sm:w-auto"
                              >
                                View Contribution
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/contributions/new?purchaseId=${purchase.id}`
                                  );
                                }}
                                className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-950 w-full sm:w-auto"
                              >
                                Add Contribution
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
