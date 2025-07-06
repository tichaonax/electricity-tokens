import { ReactNode } from 'react';

interface NavigationFormButtonProps {
  action: () => Promise<void>;
  className?: string;
  children: ReactNode;
}

export function NavigationFormButton({ 
  action, 
  className = "", 
  children 
}: NavigationFormButtonProps) {
  return (
    <form action={action} className="w-full">
      <button 
        type="submit" 
        className={`w-full text-left ${className}`}
      >
        {children}
      </button>
    </form>
  );
}