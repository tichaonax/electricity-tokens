'use client';

import { useCallback, useRef } from 'react';

export function useFormAnimations() {
  const formRef = useRef<HTMLFormElement>(null);

  const animateFormSuccess = useCallback(() => {
    if (formRef.current) {
      formRef.current.classList.add('form-success');
      setTimeout(() => {
        formRef.current?.classList.remove('form-success');
      }, 600);
    }
  }, []);

  const animateFormError = useCallback((fieldId?: string) => {
    if (fieldId) {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.add('form-error');
        setTimeout(() => {
          field.classList.remove('form-error');
        }, 500);
      }
    } else if (formRef.current) {
      formRef.current.classList.add('form-error');
      setTimeout(() => {
        formRef.current?.classList.remove('form-error');
      }, 500);
    }
  }, []);

  const animateFieldFocus = useCallback((fieldId: string) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.add('form-field-focus');
      setTimeout(() => {
        field.classList.remove('form-field-focus');
      }, 200);
    }
  }, []);

  const addValidationClasses = useCallback(
    (fieldId: string, isValid: boolean) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.remove('input-valid', 'input-invalid');
        field.classList.add(isValid ? 'input-valid' : 'input-invalid');
      }
    },
    []
  );

  const clearValidationClasses = useCallback((fieldId: string) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.remove('input-valid', 'input-invalid');
    }
  }, []);

  return {
    formRef,
    animateFormSuccess,
    animateFormError,
    animateFieldFocus,
    addValidationClasses,
    clearValidationClasses,
  };
}

// Enhanced input component props
export interface AnimatedInputProps {
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  isValid?: boolean;
  isInvalid?: boolean;
  animateOnFocus?: boolean;
}

// Button loading state hook
export function useButtonLoading() {
  const addLoadingState = useCallback((buttonElement: HTMLButtonElement) => {
    buttonElement.classList.add('btn-loading');
    buttonElement.disabled = true;
  }, []);

  const removeLoadingState = useCallback((buttonElement: HTMLButtonElement) => {
    buttonElement.classList.remove('btn-loading');
    buttonElement.disabled = false;
  }, []);

  return {
    addLoadingState,
    removeLoadingState,
  };
}
