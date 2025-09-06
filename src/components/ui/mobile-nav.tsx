'use client';

import { useState, useEffect } from 'react';
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
  ChevronRight,
  ChevronDown,
  HelpCircle,
  UserCog,
} from 'lucide-react';
import { Badge } from './badge';
import { NavigationFormButton } from './navigation-form-button';
import {
  navigateToDashboard,
  navigateToPurchaseHistory,
  navigateToUsageReports,
  navigateToFinancialReports,
  navigateToEfficiencyReports,
  navigateToAdmin,
  navigateToUserManagement,
  navigateToSecurityDashboard,
  navigateToAuditTrail,
  navigateToHelp,
  navigateToProfile,
} from '@/app/actions/navigation';
import { ThemeToggle } from './theme-toggle';

interface MobileNavProps {
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const { data: session } = useSession();

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleNav = () => setIsOpen(!isOpen);
  const closeNav = () => {
    setIsOpen(false);
    setExpandedItems(new Set()); // Reset expanded items when closing nav
  };

  const toggleSubmenu = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSignOut = async () => {
    // Set flag in sessionStorage to show logout message
    sessionStorage.setItem('justLoggedOut', 'true');
    // Use redirect: false and manually redirect to avoid NextAuth overrides
    await signOut({ redirect: false });
    closeNav();
    // Manually redirect to homepage
    window.location.href = '/';
  };

  const mainNavItems = [
    {
      icon: Home,
      label: 'Dashboard',
      action: navigateToDashboard,
    },
    {
      icon: UserCog,
      label: 'Profile & Settings',
      action: navigateToProfile,
    },
    {
      icon: FileText,
      label: 'Purchase History',
      action: navigateToPurchaseHistory,
    },
    {
      icon: BarChart3,
      label: 'Reports',
      subItems: [
        { label: 'Usage Reports', action: navigateToUsageReports },
        { label: 'Financial Reports', action: navigateToFinancialReports },
        { label: 'Efficiency Reports', action: navigateToEfficiencyReports },
      ],
    },
  ];

  const adminNavItems = [
    {
      icon: Settings,
      label: 'Admin Panel',
      action: navigateToAdmin,
    },
    {
      icon: User,
      label: 'User Management',
      action: navigateToUserManagement,
    },
    {
      icon: Shield,
      label: 'Security Dashboard',
      action: navigateToSecurityDashboard,
    },
    {
      icon: FileText,
      label: 'Audit Trail',
      action: navigateToAuditTrail,
    },
  ];

  // Don't render until component is mounted (prevents hydration issues)
  if (!isMounted) {
    return (
      <button
        className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg text-gray-600 dark:text-gray-400"
        disabled
      >
        <Menu className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile menu button - Enhanced touch target */}
      <button
        onClick={toggleNav}
        className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-600 transition-all duration-200 hover:scale-110 hover:shadow-md"
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
      <div
        className={`md:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: '100vh', minHeight: '100vh' }}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: '100vh', width: '100vw' }}
          onClick={closeNav}
        />

        {/* Slide-out panel */}
        <div
          className="relative flex flex-col w-80 max-w-xs bg-white dark:bg-gray-800 backdrop-blur-md shadow-2xl overflow-hidden border-r border-gray-200/50 dark:border-gray-700/50"
          style={{
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            ...(typeof document !== 'undefined' &&
            document.documentElement.classList.contains('dark')
              ? { backgroundColor: 'rgba(31, 41, 55, 0.98)' }
              : {}),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
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
          <div
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{
              flex: '1 1 0',
              minHeight: '0px',
              maxHeight: 'calc(100vh - 140px)',
            }}
          >
            <div className="pb-6 space-y-0">
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
                        <Badge
                          variant={
                            session.user.role === 'ADMIN'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={`text-xs font-medium ${
                            session.user.role === 'ADMIN' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {session.user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav
                className="py-4"
                style={{ display: 'block', visibility: 'visible' }}
              >
                <div className="space-y-1 px-2">
                  {/* Main navigation */}
                  <div
                    className="mb-6"
                    style={{ display: 'block', visibility: 'visible' }}
                  >
                    <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Main
                    </p>
                    {mainNavItems.map((item, index) => (
                      <div key={index}>
                        {item.subItems ? (
                          // Items with submenu - use button for toggle
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSubmenu(index);
                            }}
                            className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-500 transition-colors"
                          >
                            <item.icon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
                            {item.label}
                            <ChevronDown 
                              className={`ml-auto h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                                expandedItems.has(index) ? 'rotate-180' : ''
                              }`} 
                            />
                          </button>
                        ) : (
                          // Items without submenu - use NavigationFormButton
                          <NavigationFormButton
                            action={item.action}
                            className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-500 transition-colors"
                          >
                            <item.icon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
                            {item.label}
                          </NavigationFormButton>
                        )}

                        {/* Sub-navigation */}
                        {item.subItems && expandedItems.has(index) && (
                          <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {item.subItems.map((subItem, subIndex) => (
                              <NavigationFormButton
                                key={subIndex}
                                action={subItem.action}
                                className="group flex items-center w-full min-h-[40px] px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-100 dark:active:bg-gray-500 transition-colors"
                              >
                                {subItem.label}
                              </NavigationFormButton>
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
                      {adminNavItems.map((item, index) => (
                        <NavigationFormButton
                          key={index}
                          action={item.action}
                          className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-500 transition-colors"
                        >
                          <item.icon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 dark:text-gray-500" />
                          {item.label}
                        </NavigationFormButton>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              {/* Help Section */}
              <div className="px-2 mb-4">
                <NavigationFormButton
                  action={navigateToHelp}
                  className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-gray-200 dark:active:bg-gray-500 transition-colors"
                >
                  <HelpCircle className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
                  Help & FAQ
                </NavigationFormButton>
              </div>

              {/* Sign Out Button in main area for better visibility */}
              <div className="px-2 mb-4">
                <button
                  onClick={handleSignOut}
                  className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 active:bg-red-100 dark:active:bg-red-900/30 transition-colors border border-red-200 dark:border-red-700/50"
                >
                  <LogOut className="mr-3 h-5 w-5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                  Sign Out
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="mt-4">
                <ThemeToggle />
              </div>

              {/* Extra padding for better scrolling */}
              <div className="h-6"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 bg-white dark:bg-gray-800">
            <button
              onClick={handleSignOut}
              className="group flex items-center w-full min-h-[44px] px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 active:bg-red-100 dark:active:bg-red-900/30 transition-colors border border-red-200 dark:border-red-700/50"
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
