import { forwardRef } from 'react';
import type { ButtonProps } from './Button.types';
import { baseButtonStyles, variantStyles, sizeStyles, iconSizeStyles } from './Button.styles';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      type = 'button',
      ...restProps
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading;
    const iconSizeClass = iconSizeStyles[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isButtonDisabled}
        aria-busy={isLoading}
        aria-disabled={isButtonDisabled}
        className={cn(
          baseButtonStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...restProps}
      >
        {isLoading && (
          <Loader2
            className={cn('animate-spin shrink-0', iconSizeClass)}
            aria-hidden="true"
          />
        )}

        {!isLoading && leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {children && <span>{children}</span>}

        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
