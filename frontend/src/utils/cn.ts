export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | bigint
  | { [key: string]: any }
  | ClassValue[];

/**
 * Merges multiple class names safely into a single space-separated string.
 * Filters out falsy values (null, undefined, false, empty strings).
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
