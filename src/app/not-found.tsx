import { FileX, Home, ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
            <FileX className="h-12 w-12 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
        
        <h1 className="mt-6 text-center text-6xl font-bold text-gray-900 dark:text-white">
          404
        </h1>
        
        <h2 className="mt-2 text-center text-2xl font-semibold text-gray-900 dark:text-white">
          Page not found
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          The page you're looking for doesn't exist or has been moved
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* Helpful suggestions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                What you can do:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Check the URL for typos</li>
                <li>• Use the navigation menu to find what you need</li>
                <li>• Go back to the previous page</li>
                <li>• Search our help documentation</li>
              </ul>
            </div>

            {/* Quick links */}
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
              
              <BackButton className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </BackButton>
              
              <Link
                href="/help"
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Popular pages */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">
          Popular Pages
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/dashboard/purchases/history"
            className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">Purchase History</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">View past purchases</div>
          </Link>
          
          <Link
            href="/dashboard/contributions"
            className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">Contributions</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track your usage</div>
          </Link>
          
          <Link
            href="/dashboard/reports/usage"
            className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">Usage Reports</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">View analytics</div>
          </Link>
          
          <Link
            href="/dashboard/cost-analysis"
            className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">Cost Analysis</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Analyze costs</div>
          </Link>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Still can't find what you're looking for?{' '}
          <a 
            href="mailto:support@electricitytokens.com" 
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}