"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SelectField } from "@/components/ui/select-field";
import type { RecurringFrequency } from "@/lib/recurring/constants";
import { RECURRING_FREQUENCIES } from "@/lib/recurring/constants";
import type { RecurringTaskWithCompletion } from "@/lib/recurring/constants";

import { DeleteRoutineDialog } from "./delete-routine-dialog";

type Props = {
  refreshTrigger: number;
};

const frequencyOptions = RECURRING_FREQUENCIES.map((f) => ({
  value: f,
  label: f.charAt(0).toUpperCase() + f.slice(1),
}));

export function RoutinesPanel({ refreshTrigger }: Props) {
  const [routines, setRoutines] = useState<RecurringTaskWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<Record<string, string>>({});
  const [routineToDelete, setRoutineToDelete] =
    useState<RecurringTaskWithCompletion | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/recurring-tasks");
      const json = (await res.json()) as {
        routines?: RecurringTaskWithCompletion[];
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Failed to load routines");
        setRoutines([]);
        return;
      }
      const list = json.routines ?? [];
      setRoutines(list);
      setTitleDraft(
        Object.fromEntries(list.map((r) => [r.id, r.title])),
      );
    } catch {
      setError("Failed to load routines");
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshTrigger]);

  async function patchRoutine(
    id: string,
    body: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/recurring-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        routine?: RecurringTaskWithCompletion;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Update failed");
        return false;
      }
      if (json.routine) {
        setRoutines((rows) =>
          rows.map((r) => (r.id === id ? json.routine! : r)),
        );
        setTitleDraft((d) => ({ ...d, [id]: json.routine!.title }));
      }
      return true;
    } catch {
      setError("Update failed");
      return false;
    }
  }

  async function handleDoneToggle(id: string, next: boolean) {
    const prev = routines;
    setRoutines((rows) =>
      rows.map((r) =>
        r.id === id ? { ...r, effective_done: next } : r,
      ),
    );
    const ok = await patchRoutine(id, { done: next });
    if (!ok) setRoutines(prev);
  }

  async function handleFrequencyChange(id: string, frequency: string) {
    const f = frequency as RecurringFrequency;
    await patchRoutine(id, { frequency: f });
  }

  function handleTitleBlur(id: string) {
    const next = (titleDraft[id] ?? "").trim();
    const current = routines.find((r) => r.id === id)?.title ?? "";
    if (!next || next === current) {
      setTitleDraft((d) => ({ ...d, [id]: current }));
      return;
    }
    void patchRoutine(id, { title: next });
  }

  function requestDelete(routine: RecurringTaskWithCompletion) {
    setRoutineToDelete(routine);
  }

  async function confirmDelete() {
    if (!routineToDelete) return;
    const id = routineToDelete.id;
    setDeleteSubmitting(true);
    const prev = routines;
    setRoutines((rows) => rows.filter((r) => r.id !== id));
    setTitleDraft((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch(`/api/recurring-tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Delete failed");
        setRoutines(prev);
        setTitleDraft(
          Object.fromEntries(prev.map((r) => [r.id, r.title])),
        );
      }
    } catch {
      setError("Delete failed");
      setRoutines(prev);
      setTitleDraft(
        Object.fromEntries(prev.map((r) => [r.id, r.title])),
      );
    } finally {
      setDeleteSubmitting(false);
      setRoutineToDelete(null);
    }
  }

  if (loading) {
    return <p className="text-neutral-500">Loading routines…</p>;
  }

  if (error && routines.length === 0) {
    return (
      <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        <p className="font-medium">Could not load routines</p>
        <p className="mt-1 text-amber-200/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
      {routines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/50 px-6 py-16 text-center">
          <p className="text-neutral-400">No routines yet.</p>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
            Use Add routine next to your name to create a recurring checklist item.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {routines.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3"
            >
              <label className="flex cursor-pointer items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={r.effective_done}
                  onChange={(e) =>
                    void handleDoneToggle(r.id, e.target.checked)
                  }
                  className="size-4 shrink-0 rounded border-neutral-600 bg-black accent-white"
                />
                <input
                  type="text"
                  value={titleDraft[r.id] ?? r.title}
                  onChange={(e) =>
                    setTitleDraft((d) => ({ ...d, [r.id]: e.target.value }))
                  }
                  onBlur={() => handleTitleBlur(r.id)}
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none focus:ring-0"
                  aria-label="Routine title"
                />
              </label>
              <div className="flex shrink-0 items-center gap-2">
                <div className="w-28 sm:w-32">
                  <SelectField
                    value={r.frequency}
                    onValueChange={(v) =>
                      void handleFrequencyChange(r.id, v)
                    }
                    options={frequencyOptions}
                    placeholder="Frequency"
                    aria-label={`Frequency for ${r.title}`}
                    size="sm"
                    triggerClassName="rounded-lg border-neutral-800 bg-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => requestDelete(r)}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-900 hover:text-rose-400"
                  aria-label={`Delete ${r.title}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DeleteRoutineDialog
        routine={routineToDelete}
        deleting={deleteSubmitting}
        onClose={() => !deleteSubmitting && setRoutineToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
