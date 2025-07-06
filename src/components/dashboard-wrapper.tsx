'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DashboardClient = dynamic(
  () => import('@/components/dashboard-client').then(mod => ({ default: mod.DashboardClient })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false
  }
);

export function DashboardWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardClient />
    </Suspense>
  );
}