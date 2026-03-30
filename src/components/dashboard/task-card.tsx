"use client";

import { Pencil, Paperclip, Trash2 } from "lucide-react";

import { SelectField } from "@/components/ui/select-field";
import type { TaskRow } from "@/lib/tasks/constants";
import { STATUSES } from "@/lib/tasks/constants";
import { accentFromHex } from "@/lib/tasks/tag-styles";
import { attachmentsToLines } from "@/lib/tasks/validation";

const statusLabel: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
};

const statusOptions = STATUSES.map((s) => ({
  value: s,
  label: statusLabel[s] ?? s,
}));

type Props = {
  task: TaskRow;
  layout: "grid" | "list";
  onStatusChange: (id: string, status: TaskRow["status"]) => void;
  onDeleteRequest: (task: TaskRow) => void;
  onEditRequest: (task: TaskRow) => void;
};

export function TaskCard({
  task,
  layout,
  onStatusChange,
  onDeleteRequest,
  onEditRequest,
}: Props) {
  const accent = accentFromHex(
    task.category.color_hex,
    task.category.name,
  );
  const attachmentCount = attachmentsToLines(task.attachments)
    .split("\n")
    .filter(Boolean).length;

  const dueLabel = task.due_at
    ? new Date(task.due_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const inner = (
    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={accent.pillStyle}
        >
          {task.category.name}
        </span>
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onEditRequest(task)}
            className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-white"
            aria-label="Edit task"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(task)}
            className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-white"
            aria-label="Delete task"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug text-white">{task.title}</h3>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
            {task.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="rounded-md bg-neutral-900 px-2 py-0.5 font-medium capitalize text-neutral-300">
            {task.priority}
          </span>
          {dueLabel ? <span>{dueLabel}</span> : null}
          <span className="flex items-center gap-1">
            <Paperclip className="size-3.5" aria-hidden />
            {attachmentCount}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-800/80 pt-3">
        <SelectField
          value={task.status}
          onValueChange={(v) =>
            onStatusChange(task.id, v as TaskRow["status"])
          }
          options={statusOptions}
          placeholder="Status"
          size="sm"
          triggerClassName="max-w-[9.5rem] bg-neutral-950"
          aria-label="Task status"
        />
      </div>
    </div>
  );

  if (layout === "list") {
    return (
      <article className="flex min-h-[5.5rem] flex-row overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
        <div
          className="w-1 shrink-0 self-stretch rounded-l-xl"
          style={accent.lineStyle}
          aria-hidden
        />
        {inner}
      </article>
    );
  }

  return (
    <article className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <div
        className="h-1 w-full shrink-0 rounded-t-xl"
        style={accent.lineStyle}
      />
      {inner}
    </article>
  );
}
