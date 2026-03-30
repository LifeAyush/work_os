/** Quick-pick presets for the categories UI only (not stored as an enum). */
export const CATEGORY_COLOR_PRESETS = [
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
  "#f97316",
  "#71717a",
] as const;

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  color_hex: string;
  created_at: string;
  updated_at: string;
};

export const STATUSES = [
  "todo",
  "in_progress",
  "done",
  "blocked",
  "archived",
] as const;
export type TaskStatus = (typeof STATUSES)[number];

export const PRIORITIES = ["low", "med", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  category_id: string;
  category: CategoryRow;
  priority: Priority;
  due_at: string | null;
  description: string;
  attachments: string;
  created_at: string;
  updated_at: string;
};
