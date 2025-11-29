'use client';

import { useEffect, useState } from 'react';

export function BrowserCompatibilityWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if browser is Internet Explorer
    const isIE = /*@cc_on!@*/ false || !!document.documentMode;

    // Check if browser is very old Edge (before Chromium)
    const isOldEdge = !isIE && !!window.StyleMedia;

    // Check for other unsupported browsers
    const userAgent = navigator.userAgent;
    const isUnsupported =
      isIE ||
      isOldEdge ||
      /MSIE|Trident/.test(userAgent) ||
      /Edge?\/(?:[0-9]|1[0-7])\./.test(userAgent);

    if (isUnsupported && !localStorage.getItem('ie-warning-dismissed')) {
      setShowWarning(true);
    }
  }, []);

  const dismissWarning = () => {
    setShowWarning(false);
    setIsDismissed(true);
    localStorage.setItem('ie-warning-dismissed', 'true');
  };

  if (!showWarning || isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 border-b-4 border-yellow-500 p-4 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              Browser Compatibility Warning
            </h3>
            <div className="mt-2 text-sm">
              <p>
                You are using an outdated browser that may not support all
                features of this application. Some functionality may not work
                correctly. For the best experience, please use a modern browser
                like Chrome, Firefox, Safari, or Edge (version 79 or later).
              </p>
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={dismissWarning}
            className="inline-flex rounded-md bg-yellow-100 p-1.5 text-yellow-600 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 dark:bg-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
