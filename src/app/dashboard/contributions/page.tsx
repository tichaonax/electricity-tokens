'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, DollarSign, Zap, TrendingUp, User } from 'lucide-react';

interface Contribution {
  id: string;
  contributionAmount: number;
  meterReading: number;
  tokensConsumed: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  purchase: {
    id: string;
    totalTokens: number;
    totalPayment: number;
    purchaseDate: string;
    isEmergency: boolean;
  };
  createdAt: string;
}

export default function ContributionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchContributions();
    }
  }, [session]);

  const fetchContributions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/contributions');

      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }

      const data = await response.json();
      setContributions(data.contributions || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load contributions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEfficiency = (contribution: Contribution) => {
    const trueCost =
      (contribution.tokensConsumed / contribution.purchase.totalTokens) *
      contribution.purchase.totalPayment;
    return contribution.contributionAmount > 0
      ? (trueCost / contribution.contributionAmount) * 100
      : 0;
  };

  const calculateTrueCost = (contribution: Contribution) => {
    return (
      (contribution.tokensConsumed / contribution.purchase.totalTokens) *
      contribution.purchase.totalPayment
    );
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
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
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                User Contributions
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/dashboard/contributions/new')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Contribution
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">
                Loading contributions...
              </span>
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                No contributions
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Get started by recording your first contribution to a token
                purchase.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push('/dashboard/contributions/new')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Contribution
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow dark:bg-slate-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Total Contributed
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        $
                        {contributions
                          .reduce((sum, c) => sum + c.contributionAmount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow dark:bg-slate-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Zap className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Tokens Used
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        {contributions
                          .reduce((sum, c) => sum + c.tokensConsumed, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow dark:bg-slate-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Avg Efficiency
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        {contributions.length > 0
                          ? (
                              contributions.reduce(
                                (sum, c) => sum + calculateEfficiency(c),
                                0
                              ) / contributions.length
                            ).toFixed(1)
                          : '0'}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contributions List */}
              <div className="bg-white shadow dark:bg-slate-800 overflow-hidden sm:rounded-lg">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Recent Contributions
                  </h3>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {contributions.map((contribution) => {
                    const trueCost = calculateTrueCost(contribution);
                    const efficiency = calculateEfficiency(contribution);
                    const overpayment =
                      contribution.contributionAmount - trueCost;

                    return (
                      <div
                        key={contribution.id}
                        className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <User className="h-6 w-6 text-slate-400" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {contribution.user.name}
                                </p>
                                {session.user?.role === 'ADMIN' && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    ({contribution.user.email})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                <span>
                                  Purchase:{' '}
                                  {new Date(
                                    contribution.purchase.purchaseDate
                                  ).toLocaleDateString()}
                                </span>
                                <span>
                                  {contribution.tokensConsumed.toLocaleString()}{' '}
                                  tokens
                                </span>
                                <span>
                                  Reading:{' '}
                                  {contribution.meterReading.toLocaleString()}{' '}
                                  kWh
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-6">
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  ${contribution.contributionAmount.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Contributed
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  ${trueCost.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  True Cost
                                </p>
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-medium ${overpayment >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {overpayment >= 0 ? '+' : ''}$
                                  {overpayment.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {overpayment >= 0 ? 'Overpaid' : 'Underpaid'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {efficiency.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Efficiency
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
