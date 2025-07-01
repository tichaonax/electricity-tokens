'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  Menu, 
  X, 
  Home, 
  Settings, 
  FileText, 
  BarChart3, 
  Shield, 
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';
import { Badge } from './badge';
import { ThemeToggle } from './theme-toggle';

interface MobileNavProps {
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const toggleNav = () => setIsOpen(!isOpen);
  const closeNav = () => setIsOpen(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    closeNav();
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    closeNav();
  };

  const mainNavItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: FileText,
      label: 'Purchase History',
      path: '/dashboard/purchases',
    },
    {
      icon: BarChart3,
      label: 'Reports',
      path: '/dashboard/reports',
      subItems: [
        { label: 'Usage Reports', path: '/dashboard/reports/usage' },
        { label: 'Financial Reports', path: '/dashboard/reports/financial' },
        { label: 'Efficiency Reports', path: '/dashboard/reports/efficiency' },
      ],
    },
  ];

  const adminNavItems = [
    {
      icon: Settings,
      label: 'Admin Panel',
      path: '/dashboard/admin',
    },
    {
      icon: User,
      label: 'User Management',
      path: '/dashboard/admin/users',
    },
    {
      icon: Shield,
      label: 'Security Dashboard',
      path: '/dashboard/admin/security',
    },
    {
      icon: FileText,
      label: 'Audit Trail',
      path: '/dashboard/admin/audit',
    },
  ];

  return (
    <>
      {/* Mobile menu button - Enhanced touch target */}
      <button
        onClick={toggleNav}
        className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Mobile slide-out menu */}
      <div className={`md:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeNav}
        />

        {/* Slide-out panel */}
        <div className="relative flex flex-col w-80 max-w-xs bg-white dark:bg-gray-800 h-full shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ET</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Electricity Tokens
                </h2>
              </div>
            </div>
            <button
              onClick={closeNav}
              className="min-w-[44px] min-h-[44px] p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {/* User info */}
            {session?.user && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {session.user.email}
                    </p>
                    <div className="mt-1">
                      <Badge variant={session.user.role === 'ADMIN' ? 'destructive' : 'secondary'} className="text-xs">
                        {session.user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="py-4">
            <div className="space-y-1 px-2">
              {/* Main navigation */}
              <div className="mb-6">
                <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Main
                </p>
                {mainNavItems.map((item) => (
                  <div key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-500 transition-colors"
                    >
                      <item.icon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 dark:text-gray-500" />
                      {item.label}
                      {item.subItems && (
                        <ChevronRight className="ml-auto h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                    
                    {/* Sub-navigation */}
                    {item.subItems && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.path}
                            onClick={() => handleNavigation(subItem.path)}
                            className="group flex items-center w-full min-h-[40px] px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-100 dark:active:bg-gray-500 transition-colors"
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Admin navigation */}
              {isAdmin && (
                <div className="mb-6">
                  <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Administration
                  </p>
                  {adminNavItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-500 transition-colors"
                    >
                      <item.icon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 dark:text-gray-500" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </nav>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={handleSignOut}
              className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-500 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 dark:text-gray-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}