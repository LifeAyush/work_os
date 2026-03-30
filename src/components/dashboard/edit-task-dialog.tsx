"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { DateField } from "@/components/ui/date-field";
import { SelectField } from "@/components/ui/select-field";
import type { CategoryRow, TaskRow } from "@/lib/tasks/constants";
import {
  PRIORITIES,
  STATUSES,
  type Priority,
  type TaskStatus,
} from "@/lib/tasks/constants";
import { attachmentsToLines, dueAtIsoToYMD } from "@/lib/tasks/validation";

type Props = {
  task: TaskRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: TaskRow) => void;
  categories: CategoryRow[];
};

const statusOptions = STATUSES.map((s) => ({
  value: s,
  label: s.replace("_", " "),
}));

const priorityOptions = PRIORITIES.map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1),
}));

export function EditTaskDialog({
  task,
  open,
  onClose,
  onSaved,
  categories,
}: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<Priority>("med");
  const [categoryId, setCategoryId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setStatus(task.status);
    setPriority(task.priority);
    setCategoryId(task.category_id);
    setDueAt(dueAtIsoToYMD(task.due_at));
    setDescription(task.description);
    setAttachments(attachmentsToLines(task.attachments));
    setError(null);
  }, [open, task]);

  if (!open || !task) return null;

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const current = task;
    if (!current) return;
    setError(null);
    if (!dueAt.trim()) {
      setError("Please choose a due date.");
      return;
    }
    if (!categoryId) {
      setError("Please choose a category.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status,
          priority,
          category_id: categoryId,
          due_at: dueAt,
          description,
          attachments,
        }),
      });
      const json = (await res.json()) as { error?: string; task?: TaskRow };
      if (!res.ok) {
        setError(json.error ?? "Failed to update task");
        return;
      }
      if (json.task) {
        onSaved(json.task);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={() => !submitting && onClose()}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Edit task</h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-300">Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600/40"
              placeholder="What needs to be done?"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-300">Status</span>
              <SelectField
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
                options={statusOptions}
                placeholder="Status"
                aria-label="Status"
              />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-300">Priority</span>
              <SelectField
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
                options={priorityOptions}
                placeholder="Priority"
                aria-label="Priority"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-300">Category</span>
            <SelectField
              value={categoryId}
              onValueChange={setCategoryId}
              options={categoryOptions}
              placeholder="Category"
              aria-label="Category"
            />
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-300">Due date</span>
            <DateField
              value={dueAt}
              onChange={setDueAt}
              allowPastDates
            />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-300">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-y rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600/40"
              placeholder="Notes…"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-300">
              Attachment links (optional, one per line)
            </span>
            <textarea
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              rows={2}
              className="resize-y rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600/40"
              placeholder="https://…"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
