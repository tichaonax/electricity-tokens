'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ContributionForm } from '@/components/contribution-form';
import { type CreateUserContributionInput } from '@/lib/validations';
import { LogOut } from 'lucide-react';
import { NavigationFormButton } from '@/components/ui/navigation-form-button';
import { navigateToDashboard } from '@/app/actions/navigation';

export function NewContributionClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get purchase ID from URL params if specified
  const purchaseId = searchParams.get('purchaseId');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleSubmit = async (data: CreateUserContributionInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create contribution');
      }

      const result = await response.json();
      // console.log removed

      // Redirect to contributions list after successful creation
      setTimeout(() => {
        router.push('/dashboard/contributions');
      }, 2000);
    } catch (error) {
      // console.error removed
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <NavigationFormButton
                action={navigateToDashboard}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent"
              >
                ← Back to Dashboard
              </NavigationFormButton>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                New Contribution
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-slate-700 dark:text-slate-300">
                  {session.user?.name}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ({session.user?.role})
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ContributionForm
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            selectedPurchaseId={purchaseId || undefined}
            currentUserId={session.user?.id}
            isAdmin={session.user?.role === 'ADMIN'}
            session={session}
          />
        </div>
      </main>
    </div>
  );
}