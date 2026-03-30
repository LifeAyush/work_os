import type { CategoryRow, TaskRow, TaskStatus } from "./constants";
import { hexColorOrDefault } from "./validation";

function categoryFromDb(r: Record<string, unknown>): CategoryRow {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    slug: String(r.slug ?? ""),
    color_hex: hexColorOrDefault(String(r.color_hex ?? "")),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? r.created_at ?? ""),
  };
}

/** Resolve embedded category from Supabase join (`categories` or aliased `category`). */
export function pickCategoryEmbed(
  r: Record<string, unknown>,
): CategoryRow | null {
  const raw = r.categories ?? r.category;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return categoryFromDb(raw as Record<string, unknown>);
  }
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === "object") {
    return categoryFromDb(raw[0] as Record<string, unknown>);
  }
  return null;
}

export function taskRowFromDb(r: Record<string, unknown>): TaskRow {
  const category = pickCategoryEmbed(r);
  if (!category) {
    throw new Error("task row missing category embed");
  }
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    status: String(r.status) as TaskStatus,
    category_id: String(r.category_id ?? category.id),
    category,
    priority: String(r.priority) as TaskRow["priority"],
    due_at: r.due_at != null ? String(r.due_at) : null,
    description: String(r.description ?? ""),
    attachments: String(r.attachments ?? ""),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? r.created_at ?? ""),
  };
}

/** Explicit FK hint so the embed works even if other relationships are added later. */
export const TASK_SELECT_WITH_CATEGORY =
  "*, category:categories!tasks_category_id_fkey ( id, name, slug, color_hex, created_at, updated_at )";
