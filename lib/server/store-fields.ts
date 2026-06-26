// Shared normalization for the geo + per-day-hours fields on a Store,
// used by the admin create (POST) and update (PATCH) routes.

export type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

export type StoreExtraFields = {
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadiusKm?: number;
  timezone?: string;
  hours?: unknown;
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sanitizeTime(value: unknown): string {
  const s = String(value ?? "").trim();
  return HHMM.test(s) ? s : "";
}

// Always returns exactly 7 entries (Sun..Sat). Missing/invalid input falls
// back to a closed-by-default day so the picker never sees garbage.
export function normalizeHours(input: unknown): DayHours[] {
  const arr = Array.isArray(input) ? input : [];
  return Array.from({ length: 7 }, (_, i) => {
    const raw = (arr[i] ?? {}) as Record<string, unknown>;
    const open = sanitizeTime(raw.open);
    const close = sanitizeTime(raw.close);
    const closed = Boolean(raw.closed) || !open || !close;
    return { open, close, closed };
  });
}

// Builds the geo/timezone/hours portion of the Mongoose payload. Latitude /
// longitude are only set when provided so we never overwrite an existing pin
// with null on a partial update.
export function buildStoreExtraFields(body: StoreExtraFields) {
  const out: Record<string, unknown> = {};

  const lat = toNumberOrNull(body.latitude);
  const lng = toNumberOrNull(body.longitude);
  if (lat !== null) out.latitude = lat;
  if (lng !== null) out.longitude = lng;

  const radius = toNumberOrNull(body.deliveryRadiusKm);
  if (radius !== null && radius > 0) out.deliveryRadiusKm = radius;

  const tz = String(body.timezone ?? "").trim();
  if (tz) out.timezone = tz;

  if (body.hours !== undefined) out.hours = normalizeHours(body.hours);

  return out;
}
