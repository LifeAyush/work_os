import type { RecurringFrequency } from "./constants";

/** Period boundaries use UTC (see plan). */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * ISO 8601 week key: `YYYY-Www` (UTC). Week year is the calendar year of the week's Thursday.
 */
export function isoWeekKeyUTC(d: Date): string {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayNr = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNr + 3);
  const isoYear = date.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayDiff = (date.getTime() - jan4.getTime()) / 86400000;
  const week = 1 + Math.floor(dayDiff / 7);
  return `${isoYear}-W${pad2(week)}`;
}

export function activePeriodKey(
  frequency: RecurringFrequency,
  date: Date = new Date(),
): string {
  const y = date.getUTCFullYear();
  const m = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  switch (frequency) {
    case "daily":
      return `${y}-${m}-${day}`;
    case "monthly":
      return `${y}-${m}`;
    case "weekly":
      return isoWeekKeyUTC(date);
    default:
      return `${y}-${m}-${day}`;
  }
}
