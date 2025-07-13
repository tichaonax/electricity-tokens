'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-100 dark:bg-slate-800',
        className
      )}
    />
  );
}

// Pre-built skeleton components for common UI patterns
export function SkeletonCard() {
  return (
    <div className="space-y-3 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonButton() {
  return <Skeleton className="h-10 w-24 rounded-md" />;
}

export function SkeletonAvatar() {
  return <Skeleton className="h-12 w-12 rounded-full" />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-8 w-full"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="relative h-64 w-full">
        <Skeleton className="h-full w-full rounded-lg" />
        {/* Chart axis lines */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Dashboard-specific skeleton components
export function DashboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-skeleton">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <div className="ml-5 flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-skeleton">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <div className="ml-5 flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-skeleton">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-64" />
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ContributionProgressSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-skeleton">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function DashboardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
