'use client';

import { DashboardSidebar } from '@/components/ui/dashboard-sidebar';
import { ResponsiveNav } from '@/components/ui/responsive-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav title="Electricity Tokens Tracker" />
      
      <div className="flex">
        <DashboardSidebar />
        
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
