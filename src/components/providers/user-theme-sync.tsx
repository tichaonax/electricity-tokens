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

    if (status === 'authenticated' && session?.user?.id && !userThemeLoadedRef.current) {
      // Load user's theme preference from database
      const loadUserTheme = async () => {
        try {
          const response = await fetch('/api/user/theme');
          if (response.ok) {
            const data = await response.json();
            setTheme(data.theme);
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
    if (status === 'authenticated' && session?.user?.id && userThemeLoadedRef.current) {
      saveThemeToDatabase(theme);
    }
  }, [theme, status, session?.user?.id, saveThemeToDatabase]);

  return null; // This component doesn't render anything
}