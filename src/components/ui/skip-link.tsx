'use client';

import { useSkipLink } from '@/hooks/use-keyboard-navigation';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ targetId, children, className }: SkipLinkProps) {
  const { skipLinkRef, handleSkipToContent } = useSkipLink();

  return (
    <a
      ref={skipLinkRef}
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        handleSkipToContent(targetId);
      }}
      className={cn(
        // Hidden by default, visible when focused
        'sr-only focus:not-sr-only',
        'absolute top-4 left-4 z-50',
        'bg-indigo-600 text-white px-4 py-2 rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
}

export function SkipNavigation() {
  return (
    <>
      <SkipLink targetId="main-content">Skip to main content</SkipLink>
      <SkipLink targetId="main-navigation" className="top-16">
        Skip to navigation
      </SkipLink>
    </>
  );
}
