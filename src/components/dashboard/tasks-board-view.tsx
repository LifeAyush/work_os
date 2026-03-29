"use client";

import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Paperclip, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { TaskRow, TaskStatus } from "@/lib/tasks/constants";
import { STATUSES } from "@/lib/tasks/constants";
import { sortTasks } from "@/lib/tasks/sort";
import { tagAccent } from "@/lib/tasks/tag-styles";
import { attachmentsToLines } from "@/lib/tasks/validation";

const COLUMN_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
};

const statusSet = new Set<string>(STATUSES);

function columnCollision(args: Parameters<CollisionDetection>[0]) {
  const pointer = pointerWithin(args);
  const columnHits = pointer.filter((c) => statusSet.has(String(c.id)));
  if (columnHits.length) return columnHits;
  return closestCorners(args);
}

type BoardTaskCardProps = {
  task: TaskRow;
  onEditRequest: (task: TaskRow) => void;
  onDeleteRequest: (task: TaskRow) => void;
};

function BoardTaskCard({
  task,
  onEditRequest,
  onDeleteRequest,
}: BoardTaskCardProps) {
  const accent = tagAccent[task.primary_tag];
  const attachmentCount = attachmentsToLines(task.attachments)
    .split("\n")
    .filter(Boolean).length;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const dueLabel = task.due_at
    ? new Date(task.due_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-neutral-800 bg-neutral-950 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className={`h-0.5 w-full rounded-t-lg ${accent.line}`} aria-hidden />
      <div className="flex gap-2 p-3">
        <button
          type="button"
          className="mt-0.5 shrink-0 touch-none rounded-md p-1 text-neutral-500 hover:bg-neutral-900 hover:text-white"
          aria-label="Drag to move status"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${accent.pill}`}
            >
              {accent.label}
            </span>
            <div className="flex shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => onEditRequest(task)}
                className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-white"
                aria-label="Edit task"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteRequest(task)}
                className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-white"
                aria-label="Delete task"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-white">
            {task.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
            <span className="rounded bg-neutral-900 px-1.5 py-0.5 capitalize text-neutral-300">
              {task.priority}
            </span>
            {dueLabel ? <span>{dueLabel}</span> : null}
            <span className="flex items-center gap-0.5">
              <Paperclip className="size-3" aria-hidden />
              {attachmentCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatusColumnProps = {
  status: TaskStatus;
  tasks: TaskRow[];
  onEditRequest: (task: TaskRow) => void;
  onDeleteRequest: (task: TaskRow) => void;
};

function StatusColumn({
  status,
  tasks,
  onEditRequest,
  onDeleteRequest,
}: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[min(100%,18rem)] shrink-0 flex-col rounded-xl border bg-neutral-950/80 ${
        isOver ? "border-neutral-500 ring-1 ring-neutral-500/40" : "border-neutral-800"
      }`}
    >
      <div className="border-b border-neutral-800 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {COLUMN_LABEL[status]}
        </h3>
        <p className="text-[11px] text-neutral-600">{tasks.length} tasks</p>
      </div>
      <div className="flex max-h-[min(70vh,32rem)] flex-col gap-2 overflow-y-auto p-2">
        {tasks.map((task) => (
          <BoardTaskCard
            key={task.id}
            task={task}
            onEditRequest={onEditRequest}
            onDeleteRequest={onDeleteRequest}
          />
        ))}
      </div>
    </div>
  );
}

type Props = {
  tasks: TaskRow[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEditRequest: (task: TaskRow) => void;
  onDeleteRequest: (task: TaskRow) => void;
};

export function TasksBoardView({
  tasks,
  onStatusChange,
  onEditRequest,
  onDeleteRequest,
}: Props) {
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
  );

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, TaskRow[]>();
    for (const s of STATUSES) {
      map.set(s, []);
    }
    for (const t of tasks) {
      const list = map.get(t.status);
      if (list) list.push(t);
    }
    for (const s of STATUSES) {
      map.set(s, sortTasks(map.get(s) ?? []));
    }
    return map;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const task = tasks.find((t) => t.id === id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextStatus: TaskStatus | null = null;
    if (statusSet.has(overId)) {
      nextStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) nextStatus = overTask.status;
    }
    if (!nextStatus || task.status === nextStatus) return;
    onStatusChange(taskId, nextStatus);
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={columnCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUSES.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            tasks={byStatus.get(status) ?? []}
            onEditRequest={onEditRequest}
            onDeleteRequest={onDeleteRequest}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[min(100vw-2rem,18rem)] cursor-grabbing rounded-lg border border-neutral-600 bg-neutral-900 p-3 shadow-xl">
            <p className="line-clamp-2 text-sm font-medium text-white">
              {activeTask.title}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500">
              {COLUMN_LABEL[activeTask.status]}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
