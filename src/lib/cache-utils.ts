/**
 * Cache utilities for handling service worker cache invalidation
 */

export class CacheUtils {
  /**
   * Clear all service worker caches
   */
  static async clearServiceWorkerCache(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        
        const deletePromises = cacheNames.map(cacheName => {
          console.log(`Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        });

        await Promise.all(deletePromises);
        console.log('All service worker caches cleared');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to clear service worker cache:', error);
      return false;
    }
  }

  /**
   * Clear specific API cache entries
   */
  static async clearApiCache(apiPath?: string): Promise<boolean> {
    try {
      if ('caches' in window) {
        const cache = await caches.open('api-cache');
        
        if (apiPath) {
          // Clear specific API endpoint
          const requests = await cache.keys();
          const deletePromises = requests
            .filter(request => request.url.includes(apiPath))
            .map(request => cache.delete(request));
          
          await Promise.all(deletePromises);
          console.log(`Cleared cache for API path: ${apiPath}`);
        } else {
          // Clear all API cache
          const requests = await cache.keys();
          const deletePromises = requests.map(request => cache.delete(request));
          await Promise.all(deletePromises);
          console.log('Cleared all API cache');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to clear API cache:', error);
      return false;
    }
  }

  /**
   * Force reload all dashboard widgets by clearing their cache
   */
  static async clearDashboardCache(): Promise<void> {
    const dashboardApis = [
      '/api/dashboard/max-daily-consumption',
      '/api/dashboard/running-balance',
      '/api/dashboard/progressive-consumption',
      '/api/dashboard',
      '/api/contributions',
      '/api/purchases'
    ];

    for (const api of dashboardApis) {
      await this.clearApiCache(api);
    }

    // Also trigger a page reload after cache clearing
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  /**
   * Listen for cache invalidation headers from server
   */
  static setupCacheInvalidationListener(): void {
    // Override fetch to check for cache invalidation headers
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check for cache invalidation headers
      if (response.headers.get('X-Cache-Invalidate') === 'true' || 
          response.headers.get('X-Data-Reset') === 'true') {
        console.log('Cache invalidation detected, clearing caches...');
        await CacheUtils.clearServiceWorkerCache();
        await CacheUtils.clearDashboardCache();
      }
      
      return response;
    };
  }

  /**
   * Get cache bust parameters for fetch requests
   */
  static getCacheBustParams(): URLSearchParams {
    return new URLSearchParams({
      t: Date.now().toString(),
      v: 'no-cache',
      cb: Math.random().toString(36).substr(2, 9)
    });
  }

  /**
   * Create fetch options that bypass all caches
   */
  static getNoCacheFetchOptions(): RequestInit {
    return {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };
  }
}