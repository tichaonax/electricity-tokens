'use client';

import { useState, useEffect } from 'react';
import { X, Info, GitBranch, Clock, Server, Zap } from 'lucide-react';
import { Button } from './button';

interface BuildInfo {
  version?: string;
  gitCommit?: string;
  gitBranch?: string;
  buildTime?: string;
  nodeVersion?: string;
  platform?: string;
  arch?: string;
}

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch build info from public endpoint
      fetch('/build-info.json')
        .then((response) => response.json())
        .then((data) => {
          setBuildInfo(data);
          setLoading(false);
        })
        .catch(() => {
          // Fallback to package.json version
          setBuildInfo({
            version: '0.1.0',
            gitCommit: null,
            buildTime: null,
          });
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                About
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Electricity Tokens Tracker
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* App Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              About This Application
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              A comprehensive electricity token tracking system designed for
              shared meter management. Track usage, manage contributions, and
              analyze costs with detailed reporting and analytics.
            </p>
          </div>

          {/* Version Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Version Information
            </h3>

            {loading ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-32 rounded"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-48 rounded"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-40 rounded"></div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">
                    Version:
                  </span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    v{buildInfo?.version || '0.1.0'}
                  </span>
                </div>

                {buildInfo?.gitCommit && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      Commit:
                    </span>
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      {buildInfo.gitCommit}
                    </span>
                  </div>
                )}

                {buildInfo?.gitBranch && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">
                      Branch:
                    </span>
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                      {buildInfo.gitBranch}
                    </span>
                  </div>
                )}

                {buildInfo?.buildTime && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Built:
                    </span>
                    <span className="text-xs text-gray-900 dark:text-gray-100">
                      {formatDate(buildInfo.buildTime)}
                    </span>
                  </div>
                )}

                {buildInfo?.nodeVersion && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Server className="w-3 h-3" />
                      Node.js:
                    </span>
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                      {buildInfo.nodeVersion}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Key Features
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Token-based electricity usage tracking</li>
              <li>• Multi-user shared meter management</li>
              <li>• Automated cost calculations</li>
              <li>• Detailed usage analytics and reports</li>
              <li>• Emergency purchase tracking</li>
              <li>• Fair cost distribution system</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>© 2025 Electricity Tokens Tracker</span>
            <span>Made with ⚡ for smart energy management</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutDialog;
