'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { UserPermissions } from '@/types/permissions';
import { cn } from '@/lib/utils';
import {
  Home,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Receipt,
  Upload,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: keyof UserPermissions;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    href: '/dashboard/purchases',
    label: 'Purchases',
    icon: ShoppingCart,
  },
  {
    href: '/dashboard/purchases/new',
    label: 'New Purchase + Receipt',
    icon: Receipt,
    permission: 'canCreatePurchase',
  },
  {
    href: '/dashboard/contributions',
    label: 'Contributions',
    icon: DollarSign,
  },
  {
    href: '/dashboard/receipts/import',
    label: 'Import Historical Receipts',
    icon: Upload,
    permission: 'canImportHistoricalReceipts',
  },
  {
    href: '/dashboard/reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
  },
];

export function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { checkPermission, isAdmin } = usePermissions();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const canAccessItem = (item: NavItem) => {
    // Admins always have access to everything
    if (isAdmin) return true;
    
    if (item.adminOnly) return false;
    if (item.permission) return checkPermission(item.permission);
    return true;
  };

  const filteredNavItems = navItems.filter(canAccessItem);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="bg-white dark:bg-gray-800 shadow-lg"
          aria-label="Toggle sidebar menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out z-40',
          'w-64 overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="p-4 space-y-1">
          <div className="mb-4">
            <h2 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Navigation
            </h2>
          </div>

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    active ? 'text-blue-600 dark:text-blue-400' : ''
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </Link>
            );
          })}

          {/* Receipt Data Section */}
          <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="px-3 mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Receipt Data
            </h2>
            <div className="space-y-1">
              <Link
                href="/dashboard/purchases/new"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Receipt className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">Add Receipt</span>
              </Link>
              {checkPermission('canImportHistoricalReceipts') && (
                <Link
                  href="/dashboard/receipts/import"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    isActive('/dashboard/receipts/import')
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <Upload className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">Bulk Import</span>
                  {isActive('/dashboard/receipts/import') && (
                    <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* Permission Notice */}
          {!isAdmin && !checkPermission('canImportHistoricalReceipts') && (
            <div className="mt-4 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Bulk import requires special permission. Contact admin for access.
              </p>
            </div>
          )}

          {/* Admin Badge */}
          {isAdmin && (
            <div className="mt-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                ✓ Admin Access - All features enabled
              </p>
            </div>
          )}
        </nav>
      </aside>

      {/* Spacer for desktop to prevent content from going under sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}
