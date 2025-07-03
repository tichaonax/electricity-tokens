'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Shield, AlertTriangle } from 'lucide-react';

export default function AccountLockedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If no session or account is not locked, redirect appropriately
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && !session?.user?.locked) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const handleContactSupport = () => {
    // In a real application, this would open a support ticket or contact form
    window.location.href = 'mailto:support@electricitytokens.com?subject=Account%20Locked%20-%20Request%20for%20Review';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Lock className="h-12 w-12 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Account Locked
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Your account has been temporarily locked for security reasons
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-red-800 dark:text-red-400">Account Access Restricted</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Your account has been locked due to security concerns
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-400">
                <strong>Why was my account locked?</strong><br />
                Accounts may be locked for various security reasons including:
                <ul className="mt-2 ml-4 list-disc text-sm">
                  <li>Multiple failed login attempts</li>
                  <li>Suspicious activity detected</li>
                  <li>Security policy violations</li>
                  <li>Administrative action</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">What can I do?</h3>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <p>1. <strong>Wait for automatic unlock:</strong> Some locks are temporary and will be automatically removed after a certain period.</p>
                <p>2. <strong>Contact support:</strong> If you believe this is an error, please contact our support team for assistance.</p>
                <p>3. <strong>Review security:</strong> Check your account for any unauthorized access or suspicious activity.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleContactSupport}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Contact Support
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Sign Out
              </button>
            </div>

            {session?.user && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Account: {session.user.email}<br />
                  Locked on: {new Date().toLocaleDateString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          If you continue to experience issues, please contact our support team at{' '}
          <a href="mailto:support@electricitytokens.com" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            support@electricitytokens.com
          </a>
        </p>
      </div>
    </div>
  );
}