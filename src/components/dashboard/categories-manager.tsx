"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  CategoryColorFields,
  DEFAULT_CATEGORY_HEX,
} from "@/components/dashboard/category-color-fields";
import { DeleteCategoryDialog } from "@/components/dashboard/delete-category-dialog";
import type { CategoryRow } from "@/lib/tasks/constants";
import { accentFromHex } from "@/lib/tasks/tag-styles";
import { normalizeHexColor } from "@/lib/tasks/validation";

type Props = {
  onCategoriesChanged?: () => void;
  /** Increment to refetch list (e.g. after creating from header dialog). */
  refreshTrigger?: number;
};

export function CategoriesManager({
  onCategoriesChanged,
  refreshTrigger = 0,
}: Props) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColorHex, setEditColorHex] = useState(DEFAULT_CATEGORY_HEX);
  const [savingEdit, setSavingEdit] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const json = (await res.json()) as {
        categories?: CategoryRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Failed to load categories");
        setCategories([]);
        return;
      }
      setCategories(json.categories ?? []);
    } catch {
      setError("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshTrigger]);

  function notifyChanged() {
    onCategoriesChanged?.();
  }

  function openEdit(c: CategoryRow) {
    setEditing(c);
    setEditName(c.name);
    setEditColorHex(c.color_hex);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const name = editName.trim();
    if (!name) return;
    const color_hex = normalizeHexColor(editColorHex) ?? DEFAULT_CATEGORY_HEX;
    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color_hex }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to update");
        return;
      }
      setEditing(null);
      await load();
      notifyChanged();
    } finally {
      setSavingEdit(false);
    }
  }

  function requestDelete(c: CategoryRow) {
    setCategoryToDelete(c);
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;
    const id = categoryToDelete.id;
    setDeleteSubmitting(true);
    const prev = categories;
    setCategories((rows) => rows.filter((r) => r.id !== id));
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to delete");
        setCategories(prev);
        return;
      }
      notifyChanged();
    } catch {
      setError("Failed to delete");
      setCategories(prev);
    } finally {
      setDeleteSubmitting(false);
      setCategoryToDelete(null);
    }
  }

  if (loading) {
    return <p className="text-neutral-500">Loading categories…</p>;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {categories.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {categories.map((c) => {
            const accent = accentFromHex(c.color_hex, c.name);
            return (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={accent.lineStyle}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{c.name}</p>
                    <p className="font-mono text-xs text-neutral-500">
                      {c.color_hex}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-900 hover:text-white"
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(c)}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-900 hover:text-red-400"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/50 px-6 py-16 text-center">
          <p className="text-neutral-400">No categories yet.</p>
          <p className="mt-2 max-w-sm text-sm text-neutral-500 mx-auto">
            Use Add category next to your name to create one, or run{" "}
            <code className="rounded bg-neutral-900 px-1 text-xs">
              supabase/m3_categories.sql
            </code>{" "}
            if you expected defaults.
          </p>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => !savingEdit && setEditing(null)}
          />
          <form
            onSubmit={handleSaveEdit}
            className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Edit category</h3>
              <button
                type="button"
                onClick={() => !savingEdit && setEditing(null)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-sm">
                <span className="mb-1 block text-neutral-400">Name</span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-neutral-700 bg-black px-3 text-sm text-white focus:border-neutral-500 focus:outline-none"
                />
              </label>
              <div>
                <span className="mb-2 block text-sm text-neutral-400">
                  Color
                </span>
                <CategoryColorFields
                  idPrefix="edit"
                  value={editColorHex}
                  onChange={setEditColorHex}
                  disabled={savingEdit}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !savingEdit && setEditing(null)}
                  className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editName.trim()}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  {savingEdit ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <DeleteCategoryDialog
        category={categoryToDelete}
        deleting={deleteSubmitting}
        onClose={() => !deleteSubmitting && setCategoryToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
