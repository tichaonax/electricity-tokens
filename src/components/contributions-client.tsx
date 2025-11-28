'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useConfirmation, useAlert } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Plus,
  Users,
  DollarSign,
  Zap,
  TrendingUp,
  User,
  Trash2,
  Edit,
  ShoppingCart,
} from 'lucide-react';
import { NavigationFormButton } from '@/components/ui/navigation-form-button';
import {
  navigateToDashboard,
  navigateToNewContribution,
} from '@/app/actions/navigation';
import {
  editContribution,
  deleteContribution,
} from '@/app/actions/contributions';
import { formatDisplayDate } from '@/lib/utils';

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

export function ContributionsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { confirm } = useConfirmation();
  const { alert } = useAlert();
  const { success, error: showError } = useToast();
  const { checkPermission, isAdmin } = usePermissions();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAvailablePurchases, setHasAvailablePurchases] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [runningBalance, setRunningBalance] = useState<number>(0);

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

  // Handle highlighting specific contribution from URL fragment
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const contributionId = window.location.hash.replace('#contribution-', '');
      if (contributionId) {
        // Wait for contributions to load, then scroll to the contribution
        setTimeout(() => {
          const element = document.getElementById(
            `contribution-${contributionId}`
          );
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
            // Remove highlight after a few seconds
            setTimeout(() => {
              element.classList.remove(
                'ring-2',
                'ring-blue-500',
                'ring-opacity-50'
              );
            }, 3000);
          }
        }, 500);
      }
    }
  }, [contributions]);

  const fetchRunningBalance = async () => {
    try {
      const response = await fetch(`/api/contributions?calculateBalance=true`);
      if (response.ok) {
        const data = await response.json();
        setRunningBalance(data.runningBalance || 0);
      }
    } catch {
      // console.error removed - silent fail for running balance
      setRunningBalance(0);
    }
  };

  const fetchContributions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/contributions');

      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }

      const data = await response.json();
      setContributions(data.contributions || []);

      // Fetch global running balance
      await fetchRunningBalance();

      // Check if there are available purchases (purchases without contributions)
      await checkAvailablePurchases();
    } catch (error) {
      // console.error removed
      setError(
        error instanceof Error ? error.message : 'Failed to load contributions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkAvailablePurchases = async () => {
    try {
      const response = await fetch('/api/purchases');
      if (response.ok) {
        const data = await response.json();
        // Check if there are any purchases without contributions
        const hasAvailable =
          data.purchases?.some(
            (purchase: { contribution?: unknown }) => !purchase.contribution
          ) || false;
        setHasAvailablePurchases(hasAvailable);
      }
    } catch {
      // console.error removed
      setHasAvailablePurchases(false);
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

  // Memoize the latest contribution to avoid re-sorting on every render
  const latestContributionId = useMemo(() => {
    if (contributions.length === 0) return null;

    const sortedByCreation = [...contributions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedByCreation[0]?.id || null;
  }, [contributions]);

  const isLatestContribution = (contribution: Contribution) => {
    return contribution.id === latestContributionId;
  };

  const handleDeleteContribution = async (contribution: Contribution) => {
    console.log('Delete button clicked for contribution:', contribution.id);

    confirm({
      title: 'Delete Contribution',
      description: `Are you sure you want to delete this contribution?\n\nThis action cannot be undone and will permanently remove:\n- Contribution amount: $${contribution.contributionAmount.toFixed(2)}\n- Tokens consumed: ${contribution.tokensConsumed.toFixed(2)} kWh\n- By: ${contribution.user.name}`,
      variant: 'danger',
      onConfirm: async () => {
        console.log('User confirmed deletion');

        try {
          console.log('Starting deletion process...');
          setDeletingId(contribution.id);

          const formData = new FormData();
          formData.append('contributionId', contribution.id);

          console.log('Calling deleteContribution server action...');
          await deleteContribution(formData);

          console.log('Deletion successful, refreshing page...');
          // Refresh the page on successful deletion
          window.location.reload();
        } catch (error) {
          console.error('Error deleting contribution:', error);
          alert({
            title: 'Delete Failed',
            description: `Failed to delete contribution: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'error',
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1 mr-4">
              <div className="flex-shrink-0 [&>form]:!w-auto">
                <NavigationFormButton
                  action={navigateToDashboard}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4 sm:mr-6 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent text-sm whitespace-nowrap !w-auto h-10"
                >
                  ← Back to Dashboard
                </NavigationFormButton>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="hidden sm:inline">User Contributions</span>
                <span className="sm:hidden">Contributions</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => router.push('/dashboard/purchases/new')}
                className="flex items-center gap-1 sm:gap-2 border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 h-10 whitespace-nowrap"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Add Tokens</span>
                <span className="sm:hidden">Tokens</span>
              </button>
              <NavigationFormButton
                action={navigateToNewContribution}
                className="flex items-center gap-1 sm:gap-2 border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm text-gray-900 dark:text-gray-100 h-10"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Contribution</span>
                <span className="sm:hidden">New</span>
              </NavigationFormButton>
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

          {/* Info message when no purchases are available for contribution AND no existing contributions */}
          {!hasAvailablePurchases &&
            !isLoading &&
            contributions.length === 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    All token purchases have matching contributions. New
                    contributions can only be added when there are purchases
                    without contributions.
                  </p>
                </div>
              </div>
            )}

          {/* Message when there are existing contributions but no available purchases for new ones */}
          {!hasAvailablePurchases && !isLoading && contributions.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <div className="flex items-center">
                <User className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  All purchases have contributions. New contributions can only
                  be added when there are purchases without contributions.
                </p>
              </div>
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
                <NavigationFormButton
                  action={navigateToNewContribution}
                  className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-900 dark:text-gray-100"
                >
                  <Plus className="h-4 w-4" />
                  New Contribution
                </NavigationFormButton>
                {!hasAvailablePurchases && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    All purchases already have contributions. No new
                    contributions can be added at this time.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <div className="bg-white p-6 rounded-lg shadow dark:bg-slate-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp
                        className={`h-8 w-8 ${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Account Balance
                      </p>
                      <p
                        className={`text-2xl font-semibold ${runningBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {runningBalance >= 0 ? '+' : ''}$
                        {runningBalance.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {runningBalance >= 0 ? 'credit' : 'owed'}
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
                        Tokens Consumed
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        {contributions
                          .reduce((sum, c) => sum + c.tokensConsumed, 0)
                          .toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        kWh
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow dark:bg-slate-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Actual Cost
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        $
                        {contributions
                          .reduce((sum, c) => sum + calculateTrueCost(c), 0)
                          .toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        (your share)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow dark:bg-slate-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Amount Paid
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        $
                        {contributions
                          .reduce((sum, c) => sum + c.contributionAmount, 0)
                          .toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        total contributed
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        payment accuracy
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
                        id={`contribution-${contribution.id}`}
                        className={`px-4 sm:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 ${
                          session?.user?.role === 'ADMIN' ||
                          contribution.user.id === session?.user?.id
                            ? 'border-l-4 border-l-transparent hover:border-l-blue-500'
                            : ''
                        }`}
                      >
                        {/* Mobile Layout */}
                        <div className="lg:hidden space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                  {contribution.user.name}
                                </p>
                                {session.user?.role === 'ADMIN' && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {contribution.user.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Action Buttons */}
                            {(isAdmin ||
                              checkPermission('canEditContributions') ||
                              isAdmin ||
                              contribution.user.id === session?.user?.id ||
                              checkPermission('canDeleteContributions')) && (
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {(isAdmin ||
                                  checkPermission('canEditContributions')) && (
                                  <form
                                    action={editContribution}
                                    className="inline"
                                  >
                                    <input
                                      type="hidden"
                                      name="contributionId"
                                      value={contribution.id}
                                    />
                                    <button
                                      type="submit"
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                                      title="Edit contribution"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </form>
                                )}
                                {(isAdmin ||
                                  contribution.user.id === session?.user?.id ||
                                  checkPermission(
                                    'canDeleteContributions'
                                  )) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteContribution(contribution);
                                    }}
                                    disabled={
                                      deletingId === contribution.id ||
                                      !isLatestContribution(contribution)
                                    }
                                    className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] ${
                                      !isLatestContribution(contribution)
                                        ? 'text-slate-300 cursor-not-allowed dark:text-slate-600'
                                        : deletingId === contribution.id
                                          ? 'text-slate-400 cursor-wait'
                                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                    }`}
                                    title={
                                      !isLatestContribution(contribution)
                                        ? 'Only the latest contribution in the system can be deleted'
                                        : deletingId === contribution.id
                                          ? 'Deleting...'
                                          : 'Delete contribution'
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            {isLatestContribution(contribution) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Latest in System
                              </span>
                            )}
                            {contribution.purchase.isEmergency && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Emergency
                              </span>
                            )}
                          </div>

                          {/* Purchase Info */}
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Purchase Date:{' '}
                            {formatDisplayDate(
                              contribution.purchase.purchaseDate
                            )}
                          </div>

                          {/* Consumption */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                                {contribution.tokensConsumed.toFixed(2)} kWh
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-300">
                                Consumed (Reading:{' '}
                                {contribution.meterReading.toLocaleString()})
                              </p>
                            </div>
                          </div>

                          {/* Financial Details */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                ${contribution.contributionAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                You Paid
                              </p>
                              <p
                                className={`text-xs mt-1 ${overpayment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                              >
                                {overpayment >= 0 ? '+' : ''}$
                                {overpayment.toFixed(2)} net
                              </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                ${trueCost.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Fair Share
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {efficiency.toFixed(1)}% efficiency
                              </p>
                            </div>
                          </div>

                          {/* Rate */}
                          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                            Rate: $
                            {(
                              contribution.purchase.totalPayment /
                              contribution.purchase.totalTokens
                            ).toFixed(4)}
                            /kWh
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden lg:flex items-center justify-between">
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
                                {isLatestContribution(contribution) && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Latest in System
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                <span>
                                  Purchase:{' '}
                                  {formatDisplayDate(
                                    contribution.purchase.purchaseDate
                                  )}
                                </span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {contribution.tokensConsumed.toFixed(2)} kWh
                                  consumed
                                </span>
                                <span>
                                  Reading:{' '}
                                  {contribution.meterReading.toLocaleString()}{' '}
                                  kWh
                                </span>
                                {contribution.purchase.isEmergency && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    Emergency
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="flex items-center space-x-6">
                                <div className="text-center">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    Purchase Cost
                                  </p>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    $
                                    {contribution.purchase.totalPayment.toFixed(
                                      2
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    (
                                    {contribution.purchase.totalTokens.toLocaleString()}{' '}
                                    kWh)
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    Your Share
                                  </p>
                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    ${trueCost.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    ({contribution.tokensConsumed.toFixed(2)}{' '}
                                    kWh)
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    You Paid
                                  </p>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    $
                                    {contribution.contributionAmount.toFixed(2)}
                                  </p>
                                  <p
                                    className={`text-xs ${overpayment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                  >
                                    {overpayment >= 0 ? '+' : ''}$
                                    {overpayment.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    (net for this contribution)
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    Rate/kWh
                                  </p>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    $
                                    {(
                                      contribution.purchase.totalPayment /
                                      contribution.purchase.totalTokens
                                    ).toFixed(4)}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {efficiency.toFixed(1)}% eff.
                                  </p>
                                </div>
                              </div>
                            </div>
                            {/* Action Buttons */}
                            {(isAdmin ||
                              checkPermission('canEditContributions') ||
                              isAdmin ||
                              contribution.user.id === session?.user?.id ||
                              checkPermission('canDeleteContributions')) && (
                              <div className="flex items-center space-x-2">
                                {(isAdmin ||
                                  checkPermission('canEditContributions')) && (
                                  <form
                                    action={editContribution}
                                    className="inline"
                                  >
                                    <input
                                      type="hidden"
                                      name="contributionId"
                                      value={contribution.id}
                                    />
                                    <button
                                      type="submit"
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                                      title="Edit contribution"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </form>
                                )}
                                {(isAdmin ||
                                  contribution.user.id === session?.user?.id ||
                                  checkPermission(
                                    'canDeleteContributions'
                                  )) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteContribution(contribution);
                                    }}
                                    disabled={
                                      deletingId === contribution.id ||
                                      !isLatestContribution(contribution)
                                    }
                                    className={`p-2 rounded-lg transition-colors ${
                                      !isLatestContribution(contribution)
                                        ? 'text-slate-300 cursor-not-allowed dark:text-slate-600'
                                        : deletingId === contribution.id
                                          ? 'text-slate-400 cursor-wait'
                                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                    }`}
                                    title={
                                      !isLatestContribution(contribution)
                                        ? 'Only the latest contribution in the system can be deleted'
                                        : deletingId === contribution.id
                                          ? 'Deleting...'
                                          : 'Delete contribution'
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}
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
