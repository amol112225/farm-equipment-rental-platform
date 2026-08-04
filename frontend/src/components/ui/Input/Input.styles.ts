/**
 * Base styling applied universally to the HTML input element.
 */
export const baseInputStyles =
  'flex h-11 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs ' +
  'transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed ' +
  'disabled:bg-slate-100 disabled:opacity-60';

/**
 * Standard border and focus ring styling.
 */
export const defaultBorderStyles =
  'border-slate-300 focus-visible:border-emerald-600 focus-visible:ring-emerald-500/20';

/**
 * Error border and focus ring styling applied when validation fails.
 */
export const errorBorderStyles =
  'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/20';

/**
 * Padding offsets applied when left or right icons are present.
 */
export const iconPaddingStyles = {
  left: 'pl-10',
  right: 'pr-10',
};
