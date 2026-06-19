/**
 * Escape a user-supplied string so it can be embedded safely inside a
 * MongoDB `$regex` query without being interpreted as a regex pattern.
 *
 * Without this, input like ".*" matches every document (data exposure) and
 * pathological patterns can cause catastrophic backtracking (ReDoS).
 */
export function escapeRegex(input: string): string {
  return String(input ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
