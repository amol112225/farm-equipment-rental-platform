import { forwardRef, useId } from 'react';
import type { InputProps } from './Input.types';
import {
  baseInputStyles,
  defaultBorderStyles,
  errorBorderStyles,
  iconPaddingStyles,
} from './Input.styles';
import { cn } from '@/utils/cn';

/**
 * Production-ready, highly accessible, and flexible Input component.
 * Features label association, helper text, inline error state, icon slots, and ref forwarding.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      containerClassName,
      className,
      id: customId,
      disabled,
      required,
      ...restProps
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);
    const borderStyles = hasError ? errorBorderStyles : defaultBorderStyles;

    // Build aria-describedby association
    const describedBy = [
      hasError ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div
        className={cn(
          'flex flex-col gap-1.5',
          fullWidth ? 'w-full' : 'w-auto',
          containerClassName
        )}
      >
        {/* Input Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 select-none flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-red-500 font-bold">*</span>}
          </label>
        )}

        {/* Input Wrapper for Icon Positioning */}
        <div className="relative flex items-center w-full">
          {/* Left Icon Slot */}
          {leftIcon && (
            <div
              className="absolute left-3 flex items-center justify-center text-slate-400 pointer-events-none w-5 h-5"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Native HTML Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={cn(
              baseInputStyles,
              borderStyles,
              leftIcon ? iconPaddingStyles.left : undefined,
              rightIcon ? iconPaddingStyles.right : undefined,
              className
            )}
            {...restProps}
          />

          {/* Right Icon Slot */}
          {rightIcon && (
            <div
              className="absolute right-3 flex items-center justify-center text-slate-400 w-5 h-5"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Validation Error Message */}
        {hasError && (
          <p id={errorId} className="text-xs font-medium text-red-600 animate-fadeIn">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
