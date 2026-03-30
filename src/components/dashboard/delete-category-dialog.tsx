"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import type { CategoryRow } from "@/lib/tasks/constants";

type Props = {
  category: CategoryRow | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteCategoryDialog({
  category,
  deleting,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!category) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [category, deleting, onClose]);

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={() => !deleting && onClose()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        aria-describedby="delete-category-desc"
        className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id="delete-category-title"
            className="text-lg font-semibold text-white"
          >
            Delete category?
          </h2>
          <button
            type="button"
            onClick={() => !deleting && onClose()}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <p id="delete-category-desc" className="text-sm text-neutral-400">
          This will permanently remove{" "}
          <span className="font-medium text-neutral-200">
            {category.name.trim() || "Untitled category"}
          </span>
          . This cannot be undone. If any tasks still use this category, delete
          will be blocked until you reassign or remove them.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => !deleting && onClose()}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
