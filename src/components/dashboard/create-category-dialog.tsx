"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CategoryColorFields,
  DEFAULT_CATEGORY_HEX,
} from "@/components/dashboard/category-color-fields";
import { normalizeHexColor } from "@/lib/tasks/validation";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateCategoryDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState(DEFAULT_CATEGORY_HEX);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setColorHex(DEFAULT_CATEGORY_HEX);
    setError(null);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    const color_hex = normalizeHexColor(colorHex) ?? DEFAULT_CATEGORY_HEX;
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color_hex }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to create category");
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError("Failed to create category");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-category-title"
        className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => !submitting && onClose()}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-500 hover:bg-neutral-900 hover:text-white disabled:opacity-40"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h2
          id="create-category-title"
          className="pr-10 text-lg font-semibold text-white"
        >
          New category
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Pick a name and accent color (stored as #RRGGBB).
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="mb-1.5 block text-sm font-medium text-neutral-300"
            >
              Name
            </label>
            <input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client work"
              autoFocus
              className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-300">
              Color
            </span>
            <CategoryColorFields
              idPrefix="new"
              value={colorHex}
              onChange={setColorHex}
              disabled={submitting}
            />
          </div>
          {error ? (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-900 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              {submitting ? "Saving…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
