'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  MessageCircle,
  Book,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Users,
  Calculator,
  Settings,
} from 'lucide-react';

// interface FAQItem {
//   question: string;
//   answer: string;
//   category: string;
//   tags: string[];
// }

export default function HelpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // FAQ categories and quick access items
  const quickAccessItems = [
    {
      title: 'Getting Started',
      description: 'New to the system? Start here for basics',
      icon: Book,
      color: 'blue',
      items: [
        'How do I make my first token purchase?',
        'What is a meter reading?',
        'Understanding the dashboard',
        'Setting up my profile',
      ],
    },
    {
      title: 'Daily Usage',
      description: 'Common tasks and operations',
      icon: Clock,
      color: 'green',
      items: [
        'How to record meter readings',
        'Making contributions',
        'Viewing usage history',
        'Emergency purchases',
      ],
    },
    {
      title: 'Cost & Billing',
      description: 'Understanding costs and payments',
      icon: Calculator,
      color: 'purple',
      items: [
        'How are costs calculated?',
        'Fair share contributions',
        'Emergency purchase rates',
        'Understanding overpayments',
      ],
    },
    {
      title: 'Technical Issues',
      description: 'Troubleshooting and support',
      icon: Settings,
      color: 'red',
      items: [
        'Login problems',
        'App not loading',
        'Slow performance',
        'Error messages',
      ],
    },
  ];

  const documentationLinks = [
    {
      title: 'Complete FAQ Document',
      description: 'Access the full FAQ documentation with detailed answers',
      href: '/FAQ.md',
      icon: HelpCircle,
      isExternal: true,
    },
    {
      title: 'User Manual',
      description: 'Comprehensive user guide with step-by-step tutorials',
      href: '/USER_MANUAL.md',
      icon: Book,
      isExternal: true,
    },
    {
      title: 'Feature Tutorials',
      description: 'Learn how to use specific features effectively',
      href: '/FEATURE_TUTORIALS.md',
      icon: Users,
      isExternal: true,
    },
  ];

  const isAdmin = session.user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav
        title="Help & FAQ"
        backPath="/dashboard"
        showBackButton={true}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Help Center
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Find answers to common questions and get help with using the
              Electricity Tokens system.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search for help topics, features, or questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Help Topics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                const colorClasses = {
                  blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
                  green:
                    'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
                  purple:
                    'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
                  red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
                };

                return (
                  <Card
                    key={item.title}
                    className={`border ${colorClasses[item.color as keyof typeof colorClasses]} cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`h-6 w-6 text-${item.color}-600 dark:text-${item.color}-400`}
                        />
                        <div>
                          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {item.items.map((topic, index) => (
                          <li
                            key={index}
                            className="flex items-center text-xs text-gray-600 dark:text-gray-300"
                          >
                            <ChevronRight className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Documentation Links */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Documentation & Guides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {documentationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Card
                    key={link.title}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (link.isExternal) {
                        window.open(link.href, '_blank');
                      } else {
                        router.push(link.href);
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          <div>
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                              {link.title}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                              {link.description}
                            </CardDescription>
                          </div>
                        </div>
                        {link.isExternal && (
                          <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Admin-only Documentation */}
          {isAdmin && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Administrator Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.open('/API_DOCUMENTATION.md', '_blank')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Settings className="h-6 w-6 text-red-600 dark:text-red-400" />
                        <div>
                          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                            API Documentation
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Complete API reference for administrators
                          </CardDescription>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </CardHeader>
                </Card>

                <Card
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.open('/TROUBLESHOOTING.md', '_blank')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        <div>
                          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                            Troubleshooting Guide
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Advanced troubleshooting and system maintenance
                          </CardDescription>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <MessageCircle className="h-5 w-5 mr-2" />
                Still Need Help?
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                If you can&apos;t find the answer you&apos;re looking for, here
                are additional ways to get support:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Documentation Links
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Access our comprehensive documentation files:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>
                      • <strong>FAQ.md</strong> - Frequently asked questions
                      with detailed answers
                    </li>
                    <li>
                      • <strong>USER_MANUAL.md</strong> - Complete user guide
                      with step-by-step instructions
                    </li>
                    <li>
                      • <strong>FEATURE_TUTORIALS.md</strong> - Tutorials for
                      specific features
                    </li>
                    {isAdmin && (
                      <>
                        <li>
                          • <strong>API_DOCUMENTATION.md</strong> - API
                          reference for administrators
                        </li>
                        <li>
                          • <strong>TROUBLESHOOTING.md</strong> - Advanced
                          troubleshooting guide
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Quick Tip
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You can access this help center anytime by clicking on your
                    profile menu and selecting &quot;Help &amp; FAQ&quot; from
                    either the desktop dropdown or mobile navigation menu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
