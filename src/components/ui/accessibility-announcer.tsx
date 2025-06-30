'use client';

import { createContext, useContext, useRef, useCallback } from 'react';

interface AccessibilityAnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceRoute: (routeName: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

const AccessibilityAnnouncerContext = createContext<
  AccessibilityAnnouncerContextType | undefined
>(undefined);

export function AccessibilityAnnouncerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const politeRegionRef = useRef<HTMLDivElement>(null);
  const assertiveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const region =
        priority === 'assertive'
          ? assertiveRegionRef.current
          : politeRegionRef.current;

      if (region) {
        // Clear the region first to ensure the screen reader announces the new message
        region.textContent = '';

        // Use a slight delay to ensure the clearing is processed
        setTimeout(() => {
          region.textContent = message;
        }, 10);
      }
    },
    []
  );

  const announceRoute = useCallback(
    (routeName: string) => {
      announce(`Navigated to ${routeName} page`, 'polite');
    },
    [announce]
  );

  const announceError = useCallback(
    (error: string) => {
      announce(`Error: ${error}`, 'assertive');
    },
    [announce]
  );

  const announceSuccess = useCallback(
    (message: string) => {
      announce(`Success: ${message}`, 'polite');
    },
    [announce]
  );

  return (
    <AccessibilityAnnouncerContext.Provider
      value={{ announce, announceRoute, announceError, announceSuccess }}
    >
      {children}

      {/* Live regions for screen reader announcements */}
      <div
        ref={politeRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      <div
        ref={assertiveRegionRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
    </AccessibilityAnnouncerContext.Provider>
  );
}

export function useAccessibilityAnnouncer() {
  const context = useContext(AccessibilityAnnouncerContext);
  if (context === undefined) {
    throw new Error(
      'useAccessibilityAnnouncer must be used within an AccessibilityAnnouncerProvider'
    );
  }
  return context;
}

// Hook for route announcements
export function useRouteAnnouncement(routeName: string) {
  const { announceRoute } = useAccessibilityAnnouncer();

  // This would typically be called in a useEffect when the route changes
  const announceCurrentRoute = useCallback(() => {
    announceRoute(routeName);
  }, [announceRoute, routeName]);

  return { announceCurrentRoute };
}

// Component for manual announcements
interface AnnouncementButtonProps {
  message: string;
  priority?: 'polite' | 'assertive';
  children: React.ReactNode;
  className?: string;
}

export function AnnouncementButton({
  message,
  priority = 'polite',
  children,
  className = '',
}: AnnouncementButtonProps) {
  const { announce } = useAccessibilityAnnouncer();

  const handleClick = () => {
    announce(message, priority);
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
