'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PurchaseHistoryTable } from '@/components/purchase-history-table';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import { History } from 'lucide-react';

export default function PurchaseHistoryPage() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav 
        title="Purchase History" 
        backPath="/dashboard"
        showBackButton={true}
        backText="Back to Dashboard"
        mobileBackText="Dashboard"
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <PurchaseHistoryTable
            userId={session.user?.id}
            isAdmin={session.user?.role === 'ADMIN'}
          />
        </div>
      </main>
    </div>
  );
}
