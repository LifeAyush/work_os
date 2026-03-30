"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import type { RecurringTaskWithCompletion } from "@/lib/recurring/constants";

type Props = {
  routine: RecurringTaskWithCompletion | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteRoutineDialog({
  routine,
  deleting,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!routine) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [routine, deleting, onClose]);

  if (!routine) return null;

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
        aria-labelledby="delete-routine-title"
        aria-describedby="delete-routine-desc"
        className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id="delete-routine-title"
            className="text-lg font-semibold text-white"
          >
            Delete routine?
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
        <p id="delete-routine-desc" className="text-sm text-neutral-400">
          This will permanently remove{" "}
          <span className="font-medium text-neutral-200">
            {routine.title.trim() || "Untitled routine"}
          </span>{" "}
          and its completion history. This cannot be undone.
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
