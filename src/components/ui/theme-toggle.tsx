'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
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
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.className = systemTheme;
    } else {
      root.className = theme;
    }
    
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  if (!mounted) {
    return null;
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Theme
        </p>
        <p className="px-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
          Select your theme preference.
        </p>
        
        <div className="space-y-1">
          <button
            onClick={() => handleThemeChange('light')}
            className={`group flex items-center w-full min-h-[40px] px-3 py-2 text-sm rounded-md transition-colors ${
              theme === 'light'
                ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Sun className="mr-3 h-4 w-4" />
            Light
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            className={`group flex items-center w-full min-h-[40px] px-3 py-2 text-sm rounded-md transition-colors ${
              theme === 'dark'
                ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Moon className="mr-3 h-4 w-4" />
            Dark
          </button>
          
          <button
            onClick={() => handleThemeChange('system')}
            className={`group flex items-center w-full min-h-[40px] px-3 py-2 text-sm rounded-md transition-colors ${
              theme === 'system'
                ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Monitor className="mr-3 h-4 w-4" />
            System
          </button>
        </div>
      </div>
    </div>
  );
}