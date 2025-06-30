'use client';

import { useState } from 'react';
import { HelpCircle, Book, ExternalLink, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface HelpItem {
  title: string;
  description: string;
  link?: {
    text: string;
    url: string;
  };
}

interface HelpPopoverProps {
  title: string;
  items: HelpItem[];
  trigger?: React.ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export function HelpPopover({
  title,
  items,
  trigger,
  side = 'right',
  className
}: HelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      aria-label="Show help"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );

  return (
    <div className="relative inline-block">
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popover */}
          <div
            className={cn(
              'absolute z-50 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg',
              side === 'left' ? 'right-0' : 'left-0',
              'top-full mt-2',
              className
            )}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Book className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                  {item.link && (
                    <a
                      href={item.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {item.link.text}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Quick help for form fields
export function FieldHelp({ 
  content, 
  className 
}: { 
  content: string; 
  className?: string; 
}) {
  return (
    <HelpPopover
      title="Field Help"
      items={[{
        title: "Information",
        description: content
      }]}
      className={className}
    />
  );
}

// Feature tour component
export function FeatureTour({
  steps,
  isOpen,
  onClose,
  onNext,
  onPrev,
  currentStep = 0
}: {
  steps: Array<{
    target: string;
    title: string;
    description: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentStep?: number;
}) {
  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Tour highlight */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* This would need to be positioned based on the target element */}
        <div className="absolute bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm pointer-events-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <h3 className="font-medium text-slate-900">{step.title}</h3>
            <p className="text-sm text-slate-600">{step.description}</p>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                disabled={isFirst}
              >
                Previous
              </Button>
              <Button
                size="sm"
                onClick={isLast ? onClose : onNext}
              >
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}