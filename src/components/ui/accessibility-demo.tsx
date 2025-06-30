'use client';

import { useState } from 'react';
import { AccessibleButton } from '@/components/ui/accessible-button';
import {
  AccessibleInput,
  AccessibleTextarea,
  AccessibleSelect,
} from '@/components/ui/accessible-form';
import { AccessibleModal } from '@/components/ui/accessible-modal';
import { HighContrastButton } from '@/components/ui/high-contrast';
import { AccessibilityMenu } from '@/components/ui/accessibility-menu';
import {
  AccessibleProgress,
  ScreenReaderOnly,
  AccessibleStatus,
} from '@/components/ui/screen-reader';
import { useAccessibilityAnnouncer } from '@/components/ui/accessibility-announcer';

export function AccessibilityDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const { announce } = useAccessibilityAnnouncer();

  const handleProgressDemo = () => {
    setStatus('loading');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('success');
          announce('Progress completed successfully');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const selectOptions = [
    { value: '', label: 'Select an option' },
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Accessibility Features Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Demonstrating WCAG 2.1 compliant components with keyboard navigation
          and screen reader support
        </p>
      </div>

      {/* Accessibility Tools */}
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Accessibility Tools</h2>
        <div className="flex flex-wrap gap-4">
          <HighContrastButton />
          <AccessibilityMenu />
          <AccessibleButton
            onClick={() => announce('This is a test announcement')}
            variant="outline"
          >
            Test Screen Reader Announcement
          </AccessibleButton>
        </div>
      </div>

      {/* Form Components */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-6">
          Accessible Form Components
        </h2>
        <div className="space-y-6">
          <AccessibleInput
            label="Email Address"
            description="We'll never share your email with anyone else"
            type="email"
            placeholder="Enter your email"
            required
          />

          <AccessibleTextarea
            label="Message"
            description="Please provide detailed information"
            placeholder="Type your message here..."
            rows={4}
          />

          <AccessibleSelect
            label="Category"
            description="Select the most appropriate category"
            options={selectOptions}
            required
          />

          <div className="flex gap-3">
            <AccessibleButton type="submit">Submit Form</AccessibleButton>
            <AccessibleButton type="button" variant="outline">
              Cancel
            </AccessibleButton>
          </div>
        </div>
      </div>

      {/* Modal Demo */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Accessible Modal</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Modal with proper focus management, keyboard navigation, and screen
          reader support
        </p>
        <AccessibleButton onClick={() => setIsModalOpen(true)}>
          Open Modal
        </AccessibleButton>

        <AccessibleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Accessible Modal Example"
          description="This modal demonstrates proper accessibility features"
        >
          <div className="space-y-4">
            <p>This modal includes:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Focus trapping and restoration</li>
              <li>Proper ARIA attributes</li>
              <li>Keyboard navigation (Tab, Shift+Tab, Escape)</li>
              <li>Screen reader announcements</li>
            </ul>
            <div className="flex gap-3 pt-4">
              <AccessibleButton onClick={() => setIsModalOpen(false)}>
                Close Modal
              </AccessibleButton>
              <AccessibleButton
                variant="outline"
                onClick={() => announce('Action performed')}
              >
                Perform Action
              </AccessibleButton>
            </div>
          </div>
        </AccessibleModal>
      </div>

      {/* Progress Demo */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-4">
          Accessible Progress Indicator
        </h2>
        <div className="space-y-4">
          <AccessibleProgress
            value={progress}
            label="Demo Progress"
            description="This demonstrates an accessible progress bar with screen reader support"
          />
          <AccessibleButton
            onClick={handleProgressDemo}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Running...' : 'Start Progress Demo'}
          </AccessibleButton>
          <AccessibleStatus
            status={status}
            loadingMessage="Progress demo is running..."
            successMessage="Progress demo completed successfully!"
            errorMessage="Progress demo failed"
          />
        </div>
      </div>

      {/* Screen Reader Only Content */}
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          Screen Reader Only Content
        </h2>
        <p className="mb-4">
          This section includes content that is only visible to screen readers:
        </p>
        <ScreenReaderOnly>
          This text is only available to screen readers and other assistive
          technologies. It provides additional context that might not be
          necessary for sighted users.
        </ScreenReaderOnly>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          (Screen reader users will hear additional context that is not visually
          displayed)
        </p>
      </div>

      {/* Keyboard Navigation Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
          Keyboard Navigation Instructions
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">General Navigation</h3>
            <ul className="space-y-1">
              <li>
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                  Tab
                </kbd>{' '}
                - Next focusable element
              </li>
              <li>
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                  Shift + Tab
                </kbd>{' '}
                - Previous element
              </li>
              <li>
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                  Enter
                </kbd>{' '}
                - Activate button/link
              </li>
              <li>
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                  Space
                </kbd>{' '}
                - Activate button
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Modal/Dialog</h3>
            <ul className="space-y-1">
              <li>
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                  Escape
                </kbd>{' '}
                - Close modal
              </li>
              <li>
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                  Tab
                </kbd>{' '}
                - Cycle through modal
              </li>
              <li>
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                  Arrow Keys
                </kbd>{' '}
                - Navigate groups
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
