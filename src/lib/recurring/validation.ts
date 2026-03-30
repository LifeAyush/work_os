import { RECURRING_FREQUENCIES, type RecurringFrequency } from "./constants";

export function parseRecurringFrequency(v: string): RecurringFrequency | null {
  return (RECURRING_FREQUENCIES as readonly string[]).includes(v)
    ? (v as RecurringFrequency)
    : null;
}
