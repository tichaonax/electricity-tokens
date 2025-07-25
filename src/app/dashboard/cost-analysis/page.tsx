'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { NavigationFormButton } from '@/components/ui/navigation-form-button';
import { CostAnalysis } from '@/components/cost-analysis';
import { navigateToDashboard } from '@/app/actions/navigation';

export default function CostAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-6 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent text-sm"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                Cost Analysis & Recommendations
              </h1>
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
          <CostAnalysis
            userId={session.user?.id}
            isAdmin={session.user?.role === 'ADMIN'}
            showRecommendations={true}
            showOptimalContributions={true}
          />
        </div>
      </main>
    </div>
  );
}
