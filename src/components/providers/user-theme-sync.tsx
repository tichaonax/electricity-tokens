'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from './theme-provider';

export function UserThemeSync() {
  const { data: session, status } = useSession();
  const { theme, setTheme, saveThemeToDatabase } = useTheme();
  const lastUserIdRef = useRef<string | null>(null);
  const userThemeLoadedRef = useRef<boolean>(false);

  // Load user's theme when they log in
  useEffect(() => {
    // Reset when user changes
    if (lastUserIdRef.current !== session?.user?.id) {
      userThemeLoadedRef.current = false;
      lastUserIdRef.current = session?.user?.id || null;
    }

    // Only proceed when authentication state is determined
    if (status === 'loading') return;

    // CRITICAL: Only make API calls when authenticated
    // This prevents triggering auth redirects that pollute callbackUrls
    if (status === 'authenticated' && session?.user?.id && !userThemeLoadedRef.current) {
      // Load user's theme preference from database
      const loadUserTheme = async () => {
        try {
          // Double-check we're still authenticated before making the request
          if (status !== 'authenticated' || !session?.user?.id) {
            return;
          }
          
          const response = await fetch('/api/user/theme');
          if (response.ok) {
            const data = await response.json();
            setTheme(data.theme);
          } else if (response.status === 401) {
            // User is not authenticated, silently skip
            console.log('Theme fetch skipped: user not authenticated');
          } else {
            // If no theme found, default to system
            setTheme('system');
          }
        } catch (error) {
          console.error('Failed to load user theme preference:', error);
          // Fallback to system theme
          setTheme('system');
        } finally {
          userThemeLoadedRef.current = true;
        }
      };

      loadUserTheme();
    } else if (status === 'unauthenticated') {
      // Mark as loaded for unauthenticated users (they use localStorage)
      userThemeLoadedRef.current = true;
    }
  }, [status, session?.user?.id, setTheme]);

  // Save theme changes to database when user is authenticated
  useEffect(() => {
    // CRITICAL: Triple-check authentication before saving to prevent redirect loops
    if (status === 'authenticated' && session?.user?.id && userThemeLoadedRef.current) {
      // Additional safety check to prevent calls during signin process
      const timer = setTimeout(() => {
        if (status === 'authenticated' && session?.user?.id) {
          saveThemeToDatabase(theme);
        }
      }, 100); // Small delay to ensure session is fully established
      
      return () => clearTimeout(timer);
    }
  }, [theme, status, session?.user?.id, saveThemeToDatabase]);

  return null; // This component doesn't render anything
}