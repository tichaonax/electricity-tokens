'use client';
import { Suspense } from 'react';
import { NewContributionClient } from '@/components/new-contribution-client';

export default function NewContributionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    }>
      <NewContributionClient />
    </Suspense>
  );
}
