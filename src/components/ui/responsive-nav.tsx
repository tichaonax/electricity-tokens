'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MobileNav } from './mobile-nav';
import { Badge } from './badge';
import { ThemeToggleCompact } from './theme-toggle-compact';
import { User, ChevronDown, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ResponsiveNavProps {
  title: string;
  backPath?: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

export function ResponsiveNav({
  title,
  backPath,
  showBackButton = false,
  children,
}: ResponsiveNavProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

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
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu + Back button + Title */}
          <div className="flex items-center space-x-4">
            {/* Mobile navigation */}
            <MobileNav isAdmin={isAdmin} />

            {/* Back button (desktop only) */}
            {showBackButton && backPath && (
              <button
                onClick={() => router.push(backPath)}
                className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ← Back
              </button>
            )}

            {/* Title */}
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* Right side - User info and menu */}
          <div className="flex items-center space-x-3">
            {children}

            {/* Desktop theme toggle */}
            <div className="hidden md:block">
              <ThemeToggleCompact />
            </div>

            {/* Desktop user menu */}
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-slate-600 z-50 border border-gray-200 dark:border-slate-600">
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
                    <button
                      onClick={() => {
                        router.push('/dashboard');
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100"
                    >
                      Dashboard
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            router.push('/dashboard/admin');
                            setShowUserMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100"
                        >
                          Admin Panel
                        </button>
                        <button
                          onClick={() => {
                            router.push('/dashboard/admin/users');
                            setShowUserMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100"
                        >
                          User Management
                        </button>
                      </>
                    )}

                    {/* Help & FAQ */}
                    <button
                      onClick={() => {
                        router.push('/help');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help & FAQ
                    </button>

                    {/* Sign out */}
                    <div className="border-t border-gray-100 dark:border-slate-600 mt-1">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100"
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
