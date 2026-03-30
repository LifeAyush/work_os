"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { SelectField } from "@/components/ui/select-field";
import type { RecurringFrequency } from "@/lib/recurring/constants";
import { RECURRING_FREQUENCIES } from "@/lib/recurring/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const frequencyOptions = RECURRING_FREQUENCIES.map((f) => ({
  value: f,
  label: f.charAt(0).toUpperCase() + f.slice(1),
}));

export function CreateRoutineDialog({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("daily");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setFrequency("daily");
    setError(null);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/recurring-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, frequency }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to create routine");
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError("Failed to create routine");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-routine-title"
        className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-500 hover:bg-neutral-900 hover:text-white"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h2
          id="create-routine-title"
          className="pr-10 text-lg font-semibold text-white"
        >
          New routine
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Check it off each period; progress resets when the period changes.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="routine-title"
              className="mb-1.5 block text-sm font-medium text-neutral-300"
            >
              Title
            </label>
            <input
              id="routine-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              placeholder="e.g. Morning stretch"
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="routine-frequency"
              className="mb-1.5 block text-sm font-medium text-neutral-300"
            >
              Frequency
            </label>
            <SelectField
              id="routine-frequency"
              value={frequency}
              onValueChange={(v) =>
                setFrequency(v as RecurringFrequency)
              }
              options={frequencyOptions}
              placeholder="Frequency"
              aria-label="Frequency"
              triggerClassName="w-full rounded-xl border-neutral-800 bg-black"
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
              onClick={onClose}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
