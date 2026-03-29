"use client";

import { MessageCircle, Paperclip, Trash2 } from "lucide-react";

import { SelectField } from "@/components/ui/select-field";
import type { TaskRow } from "@/lib/tasks/constants";
import { STATUSES } from "@/lib/tasks/constants";
import { tagAccent } from "@/lib/tasks/tag-styles";
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
};

export function TaskCard({ task, layout, onStatusChange, onDeleteRequest }: Props) {
  const accent = tagAccent[task.primary_tag];
  const attachmentCount = attachmentsToLines(task.attachments)
    .split("\n")
    .filter(Boolean).length;

  const inner = (
    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${accent.pill}`}
        >
          {accent.label}
        </span>
        <button
          type="button"
          onClick={() => onDeleteRequest(task)}
          className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-white"
          aria-label="Delete task"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug text-white">{task.title}</h3>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
            {task.description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/80 pt-3">
        <div className="flex items-center gap-4 text-neutral-500">
          <span className="flex items-center gap-1 text-xs">
            <MessageCircle className="size-3.5" aria-hidden />
            0
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Paperclip className="size-3.5" aria-hidden />
            {attachmentCount}
          </span>
        </div>
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
          className={`w-1 shrink-0 self-stretch rounded-l-xl ${accent.line}`}
          aria-hidden
        />
        {inner}
      </article>
    );
  }

  return (
    <article className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <div className={`h-1 w-full shrink-0 rounded-t-xl ${accent.line}`} />
      {inner}
    </article>
  );
}
