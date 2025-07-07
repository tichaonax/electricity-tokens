'use client';

import { useEffect } from 'react';
import { CacheUtils } from '@/lib/cache-utils';

export function CacheInvalidationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up the cache invalidation listener
    CacheUtils.setupCacheInvalidationListener();

    // Clean up on unmount
    return () => {
      // Restore original fetch if needed
      // This is handled automatically since the override is in the global scope
    };
  }, []);

  return <>{children}</>;
}