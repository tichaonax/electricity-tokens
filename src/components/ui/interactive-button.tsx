'use client';

interface InteractiveButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function InteractiveButton({ 
  onClick, 
  children, 
  className, 
  disabled,
  title,
  variant = 'default'
}: InteractiveButtonProps) {
  return (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}