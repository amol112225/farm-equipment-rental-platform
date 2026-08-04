import type { ButtonVariant, ButtonSize } from './Button.types';

export const baseButtonStyles =
  'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out ' +
  'rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500 shadow-sm hover:shadow',
  secondary:
    'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 focus-visible:ring-amber-400 shadow-sm hover:shadow',
  outline:
    'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:ring-emerald-500 shadow-xs',
  ghost:
    'text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm hover:shadow',
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 min-w-[2rem]',
  md: 'h-10 px-4 text-sm gap-2 min-w-[2.5rem]',
  lg: 'h-12 px-6 text-base gap-2.5 min-w-[3rem]',
};

export const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};
