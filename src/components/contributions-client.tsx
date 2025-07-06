'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Plus, Users, DollarSign, Zap, TrendingUp, User, Trash2, Edit } from 'lucide-react';
import { NavigationFormButton } from '@/components/ui/navigation-form-button';
import { navigateToDashboard, navigateToNewContribution } from '@/app/actions/navigation';
import { editContribution, deleteContribution } from '@/app/actions/contributions';

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
  const confirmDelete = useDeleteConfirmation();
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
          const element = document.getElementById(`contribution-${contributionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
            // Remove highlight after a few seconds
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
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
    } catch (error) {
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
        const hasAvailable = data.purchases?.some((purchase: any) => !purchase.contribution) || false;
        setHasAvailablePurchases(hasAvailable);
      }
    } catch (error) {
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


  const isLatestContribution = (contribution: Contribution) => {
    // Find the globally latest contribution in the entire system
    if (contributions.length === 0) return false;
    
    // Sort all contributions by creation date and get the most recent one
    const latest = contributions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    return latest.id === contribution.id;
  };

  const handleDeleteContribution = async (contribution: Contribution) => {
    // Check if user can delete this contribution
    const canDeleteOwn = contribution.user.id === session?.user?.id;
    const canDeleteAny = checkPermission('canDeleteContributions');
    
    if (!canDeleteOwn && !canDeleteAny && !isAdmin) {
      showError('You do not have permission to delete this contribution');
      return;
    }

    // Check if this is the globally latest contribution
    if (!isLatestContribution(contribution)) {
      showError('Only the latest contribution in the system may be deleted');
      return;
    }

    confirmDelete('contribution', async () => {
      try {
        setDeletingId(contribution.id);
        const response = await fetch(`/api/contributions/${contribution.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete contribution');
        }

        // Remove the contribution from the list
        setContributions(prev => prev.filter(c => c.id !== contribution.id));
        success('Contribution deleted successfully');
      } catch (error) {
        // console.error removed
        showError(error instanceof Error ? error.message : 'Failed to delete contribution');
      } finally {
        setDeletingId(null);
      }
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
            <div className="flex items-center min-w-0 flex-1">
              <NavigationFormButton
                action={navigateToDashboard}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-2 sm:mr-4 p-0 h-auto font-normal bg-transparent border-none flex-shrink-0"
              >
                ← Back
              </NavigationFormButton>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="hidden sm:inline">User Contributions</span>
                <span className="sm:hidden">Contributions</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NavigationFormButton
                action={navigateToNewContribution}
                className="flex items-center gap-1 sm:gap-2 border border-gray-300 px-2 sm:px-4 py-2 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 text-sm"
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

          {/* Info message when no purchases are available for contribution */}
          {!hasAvailablePurchases && !isLoading && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  All token purchases have matching contributions. New contributions can only be added when there are purchases without contributions.
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
                  className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  New Contribution
                </NavigationFormButton>
                {!hasAvailablePurchases && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    All purchases already have contributions. No new contributions can be added at this time.
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
                      <TrendingUp className={`h-8 w-8 ${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Account Balance
                      </p>
                      <p className={`text-2xl font-semibold ${runningBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {runningBalance >= 0 ? '+' : ''}${runningBalance.toFixed(2)}
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
                          (session?.user?.role === 'ADMIN' || contribution.user.id === session?.user?.id) 
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
                            {(isAdmin || contribution.user.id === session?.user?.id || checkPermission('canDeleteContributions')) && (
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <form action={editContribution} className="inline">
                                  <input type="hidden" name="contributionId" value={contribution.id} />
                                  <button
                                    type="submit"
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                                    title="Edit contribution"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </form>
                                <form action={deleteContribution} className="inline">
                                  <input type="hidden" name="contributionId" value={contribution.id} />
                                  <button
                                    type="submit"
                                    disabled={deletingId === contribution.id || !isLatestContribution(contribution)}
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
                                </form>
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
                            Purchase Date: {new Date(contribution.purchase.purchaseDate).toLocaleDateString()}
                          </div>

                          {/* Consumption */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                                {contribution.tokensConsumed.toLocaleString()} kWh
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-300">
                                Consumed (Reading: {contribution.meterReading.toLocaleString()})
                              </p>
                            </div>
                          </div>

                          {/* Financial Details */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                ${contribution.contributionAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">You Paid</p>
                              <p className={`text-xs mt-1 ${overpayment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {overpayment >= 0 ? '+' : ''}${overpayment.toFixed(2)} net
                              </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                ${trueCost.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Fair Share</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {efficiency.toFixed(1)}% efficiency
                              </p>
                            </div>
                          </div>

                          {/* Rate */}
                          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                            Rate: ${(contribution.purchase.totalPayment / contribution.purchase.totalTokens).toFixed(4)}/kWh
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
                                  {new Date(
                                    contribution.purchase.purchaseDate
                                  ).toLocaleDateString()}
                                </span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {contribution.tokensConsumed.toLocaleString()}{' '}
                                  kWh consumed
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
                                    ${contribution.purchase.totalPayment.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    ({contribution.purchase.totalTokens.toLocaleString()} kWh)
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
                                    ({contribution.tokensConsumed.toLocaleString()} kWh)
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    You Paid
                                  </p>
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    ${contribution.contributionAmount.toFixed(2)}
                                  </p>
                                  <p
                                    className={`text-xs ${overpayment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                  >
                                    {overpayment >= 0 ? '+' : ''}${overpayment.toFixed(2)}
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
                                    ${(contribution.purchase.totalPayment / contribution.purchase.totalTokens).toFixed(4)}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {efficiency.toFixed(1)}% eff.
                                  </p>
                                </div>
                              </div>
                            </div>
                            {/* Action Buttons */}
                            {(isAdmin || contribution.user.id === session?.user?.id || checkPermission('canDeleteContributions')) && (
                              <div className="flex items-center space-x-2">
                                <form action={editContribution} className="inline">
                                  <input type="hidden" name="contributionId" value={contribution.id} />
                                  <button
                                    type="submit"
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                                    title="Edit contribution"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </form>
                                <form action={deleteContribution} className="inline">
                                  <input type="hidden" name="contributionId" value={contribution.id} />
                                  <button
                                    type="submit"
                                    disabled={deletingId === contribution.id || !isLatestContribution(contribution)}
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
                                </form>
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