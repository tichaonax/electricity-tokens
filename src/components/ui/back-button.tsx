'use client';

interface BackButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function BackButton({ children, className }: BackButtonProps) {
  return (
    <button
      onClick={() => window.history.back()}
      className={className}
    >
      {children}
    </button>
  );
}