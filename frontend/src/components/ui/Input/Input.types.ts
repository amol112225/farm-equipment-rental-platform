import type { InputHTMLAttributes, ReactNode } from 'react';

/**
 * Props definition for the Input component.
 * Extends native HTML input attributes to preserve standard input behavior.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional text label rendered above the input field */
  label?: string;
  /** Optional helper text rendered below the input field */
  helperText?: string;
  /** Optional validation error message. Triggers error styling when present */
  error?: string;
  /** Icon element to render inside the left side of the input field */
  leftIcon?: ReactNode;
  /** Icon element to render inside the right side of the input field */
  rightIcon?: ReactNode;
  /** Expands input container to fill 100% of parent width */
  fullWidth?: boolean;
  /** Additional custom Tailwind classes for the outer container element */
  containerClassName?: string;
}
