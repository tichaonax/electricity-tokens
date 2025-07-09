'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

export function useScrollRestoration(key: string = 'dashboard') {
  const router = useRouter();
  const pathname = usePathname();
  const isRestoringScroll = useRef(false);

  // Storage key for this specific page
  const storageKey = `scroll-position-${key}`;

  // Check if the device is mobile
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  // Save current scroll position to sessionStorage
  const saveScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Don't save scroll position on mobile devices
    if (isMobile()) return;

    const scrollPosition: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(scrollPosition));
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  }, [storageKey, isMobile]);

  // Restore scroll position from sessionStorage
  const restoreScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Don't restore scroll position on mobile devices
    if (isMobile()) return;

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;

      const scrollPosition: ScrollPosition = JSON.parse(saved);

      // Only restore if the saved position is recent (within last 5 minutes)
      const isRecent = Date.now() - scrollPosition.timestamp < 5 * 60 * 1000;
      if (!isRecent) {
        sessionStorage.removeItem(storageKey);
        return;
      }

      // Set flag to prevent interference with other scroll events
      isRestoringScroll.current = true;

      // Restore scroll position
      window.scrollTo({
        left: scrollPosition.x,
        top: scrollPosition.y,
        behavior: 'instant',
      });

      // Reset flag after a short delay
      setTimeout(() => {
        isRestoringScroll.current = false;
      }, 100);
    } catch (error) {
      console.warn('Failed to restore scroll position:', error);
    }
  }, [storageKey, isMobile]);

  // Clear saved scroll position
  const clearScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear scroll position:', error);
    }
  }, [storageKey]);

  // Navigate to another page and save current scroll position
  const navigateAndSaveScroll = useCallback(
    (path: string) => {
      // Only save scroll position on non-mobile devices
      if (!isMobile()) {
        saveScrollPosition();
      }
      router.push(path);
    },
    [router, saveScrollPosition, isMobile]
  );

  // Navigate back and restore scroll position
  const navigateBackAndRestore = useCallback(
    (path: string) => {
      // Don't save scroll position when navigating back
      router.push(path);
      // Scroll restoration will happen in useEffect after navigation
    },
    [router]
  );

  // Effect to handle scroll restoration on page load/navigation
  useEffect(() => {
    // Only restore scroll position if we're on the target page
    if (
      pathname === `/${key}` ||
      (key === 'dashboard' && pathname === '/dashboard')
    ) {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        restoreScrollPosition();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [pathname, key, restoreScrollPosition]);

  // Effect to handle browser back/forward button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      // Restore scroll position when using browser back/forward
      setTimeout(() => {
        restoreScrollPosition();
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [restoreScrollPosition]);

  // Effect to save scroll position before page unload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      // Only save scroll position on non-mobile devices
      if (!isMobile()) {
        saveScrollPosition();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveScrollPosition, isMobile]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
    navigateAndSaveScroll,
    navigateBackAndRestore,
    isRestoringScroll: isRestoringScroll.current,
  };
}
