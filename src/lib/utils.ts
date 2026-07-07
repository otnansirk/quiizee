/**
 * Simple className merger function that filters out falsy values and joins classes.
 */
export function cn(...classes: (string | undefined | null | false | 0 | '')[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generates a random 6-character uppercase alphanumeric code.
 * Used for quiz access codes.
 */
export function generateAccessCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a result code in the format 'RES-' followed by 6 random uppercase alphanumeric characters.
 * Used for tracking quiz results and attempts.
 */
export function generateResultCode(): string {
  return `RES-${generateAccessCode()}`;
}
