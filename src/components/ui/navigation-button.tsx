'use client';

import { useRouter } from 'next/navigation';

interface NavigationButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavigationButton({ href, children, className }: NavigationButtonProps) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push(href)}
      className={className}
    >
      {children}
    </button>
  );
}