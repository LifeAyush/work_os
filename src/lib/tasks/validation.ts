import {
  type PrimaryTag,
  type Priority,
  type TaskStatus,
  PRIORITIES,
  PRIMARY_TAGS,
  STATUSES,
} from "./constants";

export function parseTaskStatus(v: string): TaskStatus | null {
  return (STATUSES as readonly string[]).includes(v)
    ? (v as TaskStatus)
    : null;
}

export function parsePriority(v: string): Priority | null {
  return (PRIORITIES as readonly string[]).includes(v)
    ? (v as Priority)
    : null;
}

export function parsePrimaryTag(v: string): PrimaryTag | null {
  return (PRIMARY_TAGS as readonly string[]).includes(v)
    ? (v as PrimaryTag)
    : null;
}

export function attachmentsFromTextarea(raw: string): string {
  const lines = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(lines);
}

export function attachmentsToLines(json: string): string {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return "";
    return arr.filter((x) => typeof x === "string").join("\n");
  } catch {
    return "";
  }
}

export function todayYMDLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local calendar start of today (00:00:00) for date pickers. */
export function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** `YYYY-MM-DD` on or after today's local date. */
export function isOnOrAfterTodayYMD(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  return ymd >= todayYMDLocal();
}
