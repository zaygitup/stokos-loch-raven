// Generates the list of selectable pickup/delivery times for the scheduled-time
// wheel, constrained to (now + lead) → that day's closing time. All "now" math
// is done in the store's own timezone so it is correct regardless of where the
// customer's browser clock is set.

export type DayHours = {
  open: string; // "HH:mm" (24h)
  close: string; // "HH:mm" (24h)
  closed: boolean;
};

export const SLOT_INTERVAL_MIN = 15;
export const LEAD_TIME_MIN = 30;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Current weekday index (0=Sun) and minutes-since-midnight in `timeZone`.
export function getZonedNow(timeZone: string): {
  weekdayIndex: number;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const weekdayIndex = WEEKDAYS.indexOf(map.weekday);
  const hour = parseInt(map.hour, 10) % 24;
  const minute = parseInt(map.minute, 10);

  return { weekdayIndex, minutes: hour * 60 + minute };
}

function parseHHMM(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// "17:30" minutes → "5:30 PM" (matches the existing stored time format).
export function formatSlotLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const min = minutes % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

export function generateTimeSlots(opts: {
  hours: DayHours[];
  timezone: string;
  day: string; // "Today" | "Tomorrow"
}): string[] {
  const { hours, timezone, day } = opts;
  if (!Array.isArray(hours) || hours.length < 7) return [];

  const now = getZonedNow(timezone);
  if (now.weekdayIndex < 0) return [];

  const isToday = day !== "Tomorrow";
  const dayIndex = isToday ? now.weekdayIndex : (now.weekdayIndex + 1) % 7;

  const dh = hours[dayIndex];
  if (!dh || dh.closed) return [];

  const open = parseHHMM(dh.open);
  const close = parseHHMM(dh.close);
  if (open == null || close == null || close <= open) return [];

  let earliest = open;
  if (isToday) earliest = Math.max(open, now.minutes + LEAD_TIME_MIN);

  // Round up to the next slot boundary.
  earliest = Math.ceil(earliest / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN;

  const slots: string[] = [];
  for (let t = earliest; t <= close; t += SLOT_INTERVAL_MIN) {
    slots.push(formatSlotLabel(t));
  }
  return slots;
}
