import { type Priority, type TaskStatus, PRIORITIES, STATUSES } from "./constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseUuid(v: string): string | null {
  const t = v.trim();
  return UUID_RE.test(t) ? t : null;
}

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

const DEFAULT_HEX = "#71717a";

/** Normalize to `#rrggbb` or return null if invalid (only hex digits, 3 or 6 chars). */
export function normalizeHexColor(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let s = raw.startsWith("#") ? raw.slice(1) : raw;
  if (!/^[0-9a-fA-F]+$/.test(s)) return null;
  if (s.length === 3) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (s.length !== 6) return null;
  return `#${s.toLowerCase()}`;
}

/** Safe hex for DB/API; falls back to neutral zinc-500. */
export function hexColorOrDefault(input: string | undefined | null): string {
  return normalizeHexColor(String(input ?? "")) ?? DEFAULT_HEX;
}

/** URL-safe slug from display name; empty if nothing left after normalize. */
export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar `YYYY-MM-DD` (basic format check). */
export function isValidYMD(ymd: string): boolean {
  return YMD_RE.test(ymd);
}

/** Extract `YYYY-MM-DD` from a DB `due_at` ISO string for date inputs. */
export function dueAtIsoToYMD(iso: string | null): string {
  if (!iso) return "";
  const d = iso.trim().slice(0, 10);
  return isValidYMD(d) ? d : "";
}

/** `YYYY-MM-DD` on or after today's local date. */
export function isOnOrAfterTodayYMD(ymd: string): boolean {
  if (!YMD_RE.test(ymd)) return false;
  return ymd >= todayYMDLocal();
}
