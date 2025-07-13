'use client';

import { useSession, signOut } from 'next-auth/react';
import { MobileNav } from './mobile-nav';
import { Badge } from './badge';
import { ThemeToggleCompact } from './theme-toggle-compact';
import { User, ChevronDown, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { NavigationFormButton } from './navigation-form-button';
import {
  navigateToDashboard,
  navigateToAdmin,
  navigateToUserManagement,
  navigateToHelp,
  navigateToProfile,
} from '@/app/actions/navigation';

interface ResponsiveNavProps {
  title: string;
  backPath?: string;
  showBackButton?: boolean;
  backText?: string;
  mobileBackText?: string;
  children?: React.ReactNode;
  // New props for dual navigation context
  showBackToDashboard?: boolean;
  dashboardPath?: string;
  dashboardText?: string;
}

export function ResponsiveNav({
  title,
  backPath,
  showBackButton = false,
  backText,
  mobileBackText,
  children,
  showBackToDashboard = false,
  dashboardText = 'Back to Dashboard',
}: ResponsiveNavProps) {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [version, setVersion] = useState<string>('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  // Fetch version info
  useEffect(() => {
    fetch('/build-info.json')
      .then((response) => response.json())
      .then((data) => setVersion(data.version || '0.1.0'))
      .catch(() => setVersion('0.1.0'));
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu + Back button + Title */}
          <div className="flex items-center space-x-4">
            {/* Mobile navigation */}
            <MobileNav isAdmin={isAdmin} />

            {/* Back button */}
            {showBackButton && backPath && (
              <NavigationFormButton
                action={
                  backPath === '/dashboard'
                    ? navigateToDashboard
                    : navigateToAdmin
                }
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent border border-gray-300 dark:border-gray-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <span className="hidden sm:inline">← {backText || 'Back'}</span>
                <span className="sm:hidden">
                  ← {mobileBackText || backText || 'Back'}
                </span>
              </NavigationFormButton>
            )}

            {/* Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400">
                {title}
              </h1>
              {version && (
                <Badge
                  variant="secondary"
                  className="text-xs hidden sm:inline-flex bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1"
                >
                  v{version}
                </Badge>
              )}
            </div>
          </div>

          {/* Right side - User info and menu */}
          <div className="flex items-center space-x-3">
            {children}

            {/* Dashboard button */}
            {showBackToDashboard && (
              <NavigationFormButton
                action={navigateToDashboard}
                className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent border border-gray-300 dark:border-gray-600"
              >
                {dashboardText}
              </NavigationFormButton>
            )}

            {/* Desktop theme toggle */}
            <div className="hidden md:block">
              <ThemeToggleCompact />
            </div>

            {/* Desktop user menu */}
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400 transition-all duration-200" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-32">
                    {session?.user?.name || 'User'}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Badge
                      variant={isAdmin ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {session?.user?.role || 'USER'}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </button>

              {/* Desktop dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 dark:ring-slate-600 z-50 border border-gray-200/50 dark:border-slate-600/50 animate-fade-in">
                  <div className="py-1">
                    {/* User info section */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-600">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {session?.user?.email}
                      </p>
                    </div>

                    {/* Navigation links */}
                    <NavigationFormButton
                      action={navigateToDashboard}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-all duration-200 hover:pl-6"
                    >
                      Dashboard
                    </NavigationFormButton>

                    <NavigationFormButton
                      action={navigateToProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-all duration-200 hover:pl-6"
                    >
                      Profile & Settings
                    </NavigationFormButton>

                    {isAdmin && (
                      <>
                        <NavigationFormButton
                          action={navigateToAdmin}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-all duration-200 hover:pl-6"
                        >
                          Admin Panel
                        </NavigationFormButton>
                        <NavigationFormButton
                          action={navigateToUserManagement}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-all duration-200 hover:pl-6"
                        >
                          User Management
                        </NavigationFormButton>
                      </>
                    )}

                    {/* Help & FAQ */}
                    <NavigationFormButton
                      action={navigateToHelp}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help & FAQ
                    </NavigationFormButton>

                    {/* Sign out */}
                    <div className="border-t border-gray-100 dark:border-slate-600 mt-1">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-all duration-200 hover:pl-6"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile user avatar */}
            <div className="md:hidden w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
