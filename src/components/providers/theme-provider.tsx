'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    const applyTheme = (newTheme: Theme) => {
      let resolvedTheme: 'light' | 'dark';
      
      if (newTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        resolvedTheme = systemTheme;
      } else {
        resolvedTheme = newTheme;
      }
      
      // Only manage theme classes, preserve all other classes
      root.classList.remove('light', 'dark');
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
      }
      // For light mode, we don't add any class (default)
      
      setActualTheme(resolvedTheme);
      localStorage.setItem('theme', newTheme);
    };

    applyTheme(theme);

    // Listen for system theme changes when using system preference
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, mounted]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}