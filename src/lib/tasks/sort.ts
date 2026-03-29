import type { Priority, TaskRow } from "./constants";

const priorityOrder: Record<Priority, number> = {
  high: 0,
  med: 1,
  low: 2,
};

export function sortTasks(rows: TaskRow[]): TaskRow[] {
  return [...rows].sort((a, b) => {
    const da = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
    const db = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
