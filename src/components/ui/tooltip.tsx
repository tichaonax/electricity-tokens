'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 500,
  className,
  disabled = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipPos = calculatePosition(rect, side, align);
        setPosition(tooltipPos);
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <TooltipContent
          content={content}
          position={position}
          side={side}
          className={className}
        />
      )}
    </>
  );
}

function TooltipContent({
  content,
  position,
  side,
  className
}: {
  content: React.ReactNode;
  position: { x: number; y: number };
  side: string;
  className?: string;
}) {
  const tooltipElement = (
    <div
      className={cn(
        'fixed z-50 px-3 py-2 text-sm text-white bg-slate-900 dark:bg-slate-700 rounded-md shadow-lg pointer-events-none',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {content}
      <TooltipArrow side={side} />
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(tooltipElement, document.body)
    : null;
}

function TooltipArrow({ side }: { side: string }) {
  const arrowClasses = {
    top: 'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700',
    bottom: 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-slate-700',
    left: 'absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900 dark:border-l-slate-700',
    right: 'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700'
  };

  return <div className={arrowClasses[side as keyof typeof arrowClasses]} />;
}

function calculatePosition(
  triggerRect: DOMRect,
  side: string,
  align: string
) {
  const offset = 8;
  let x = 0;
  let y = 0;

  switch (side) {
    case 'top':
      y = triggerRect.top - offset;
      x = align === 'start' 
        ? triggerRect.left
        : align === 'end'
        ? triggerRect.right
        : triggerRect.left + triggerRect.width / 2;
      break;
    case 'bottom':
      y = triggerRect.bottom + offset;
      x = align === 'start'
        ? triggerRect.left
        : align === 'end'
        ? triggerRect.right
        : triggerRect.left + triggerRect.width / 2;
      break;
    case 'left':
      x = triggerRect.left - offset;
      y = align === 'start'
        ? triggerRect.top
        : align === 'end'
        ? triggerRect.bottom
        : triggerRect.top + triggerRect.height / 2;
      break;
    case 'right':
      x = triggerRect.right + offset;
      y = align === 'start'
        ? triggerRect.top
        : align === 'end'
        ? triggerRect.bottom
        : triggerRect.top + triggerRect.height / 2;
      break;
  }

  return { x, y };
}