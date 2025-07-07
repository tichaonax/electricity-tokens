import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { UserThemeSync } from '@/components/providers/user-theme-sync';
import { CSRFProvider } from '@/components/security/CSRFProvider';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmationProvider } from '@/components/ui/confirmation-dialog';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { HighContrastProvider } from '@/components/ui/high-contrast';
import { AccessibilityAnnouncerProvider } from '@/components/ui/accessibility-announcer';
import { SkipNavigation } from '@/components/ui/skip-link';
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Electricity Tokens Tracker',
  description: 'Track and manage electricity usage with token-based billing',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  viewport:
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      {
        url: '/icons/icon-144x144.svg',
        sizes: '144x144',
        type: 'image/svg+xml',
      },
      {
        url: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/icons/icon-152x152.svg',
        sizes: '152x152',
        type: 'image/svg+xml',
      },
      {
        url: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ET Tracker',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SkipNavigation />
        <AuthProvider>
          <ThemeProvider>
            <UserThemeSync />
            <CSRFProvider>
              <HighContrastProvider>
                <AccessibilityAnnouncerProvider>
                  <ErrorBoundary>
                    <ToastProvider>
                      <ConfirmationProvider>
                        <main id="main-content" tabIndex={-1}>
                          {children}
                        </main>
                        <OfflineIndicator />
                      </ConfirmationProvider>
                    </ToastProvider>
                  </ErrorBoundary>
                </AccessibilityAnnouncerProvider>
              </HighContrastProvider>
            </CSRFProvider>
          </ThemeProvider>
        </AuthProvider>
        <Analytics debug={false} />
      </body>
    </html>
  );
}
