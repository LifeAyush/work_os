export const PRIMARY_TAGS = ["breathe", "freelance", "general"] as const;
export type PrimaryTag = (typeof PRIMARY_TAGS)[number];

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
  primary_tag: PrimaryTag;
  priority: Priority;
  due_at: string | null;
  description: string;
  attachments: string;
  created_at: string;
  updated_at: string;
};
