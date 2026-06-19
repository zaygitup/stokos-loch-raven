/**
 * Money utilities.
 *
 * All arithmetic on monetary values must be done in integer cents, never in
 * floating-point dollars. Floating-point math (e.g. `subtotal * taxRate / 100`)
 * accumulates rounding errors, which can make the persisted order total disagree
 * with the amount Stripe actually charges (the sum of per-line-item cents).
 *
 * Convention: convert dollar inputs (from the client / DB) to cents at the
 * boundary with {@link toCents}, do all addition/subtraction/percentages in
 * cents, and convert back with {@link toDollars} only when persisting or
 * displaying.
 */

/** Convert a dollar amount (number or numeric string) to integer cents. */
export function toCents(dollars: unknown): number {
  const n = typeof dollars === "number" ? dollars : Number(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Convert integer cents to a dollar number with 2-decimal precision. */
export function toDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Percentage of a cents amount, rounded to the nearest cent.
 * e.g. `percentOfCents(1000, 6)` → 60 (6% of $10.00).
 */
export function percentOfCents(cents: number, percent: unknown): number {
  const p = typeof percent === "number" ? percent : Number(percent);
  if (!Number.isFinite(p) || p <= 0) return 0;
  return Math.round((cents * p) / 100);
}

/** Format an integer-cents amount as a "$0.00" string. */
export function formatCents(cents: number): string {
  return `$${toDollars(cents).toFixed(2)}`;
}
