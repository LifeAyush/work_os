"use client";

import {
  BarChart2,
  CheckSquare,
  Columns3,
  LayoutGrid,
  List,
  LogOut,
  Plus,
  Search,
  Tags,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearStoredProfile,
  displayLabel,
  profileFromUser,
  readStoredProfile,
} from "@/lib/auth/profile-storage";
import { createClient } from "@/lib/supabase/client";
import type { CategoryRow, TaskRow } from "@/lib/tasks/constants";
import { sortTasks } from "@/lib/tasks/sort";

import { CategoriesManager } from "./categories-manager";
import { CreateTaskDialog } from "./create-task-dialog";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import { SignOutDialog } from "./sign-out-dialog";
import { TaskCard } from "./task-card";
import { TasksBoardView } from "./tasks-board-view";

type Tab = "tasks" | "tracker" | "categories";

export function DashboardApp() {
  const [tab, setTab] = useState<Tab>("tasks");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "board">("grid");
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskRow | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<TaskRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const envFallback =
    process.env.NEXT_PUBLIC_DISPLAY_NAME?.trim() || "there";
  const [displayName, setDisplayName] = useState(envFallback);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const json = (await res.json()) as {
        categories?: CategoryRow[];
        error?: string;
      };
      if (res.ok) {
        setCategories(json.categories ?? []);
      }
    } catch {
      /* ignore; tasks screen may still work */
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tasks?category_id=all");
      const json = (await res.json()) as {
        tasks?: TaskRow[];
        error?: string;
      };
      if (!res.ok) {
        setLoadError(json.error ?? "Failed to load tasks");
        setTasks([]);
        return;
      }
      setTasks(sortTasks(json.tasks ?? []));
    } catch {
      setLoadError("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const stored = readStoredProfile();
    if (stored) {
      setDisplayName(displayLabel(stored, envFallback));
      setAvatarUrl(stored.avatar_url);
    }

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const p = profileFromUser(user);
        setDisplayName(displayLabel(p, envFallback));
        setAvatarUrl(p.avatar_url);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        const p = profileFromUser(u);
        setDisplayName(displayLabel(p, envFallback));
        setAvatarUrl(p.avatar_url);
      }
    });

    return () => subscription.unsubscribe();
  }, [envFallback]);

  async function confirmSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearStoredProfile();
    window.location.href = "/login";
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tasks.length };
    for (const t of tasks) {
      c[t.category_id] = (c[t.category_id] ?? 0) + 1;
    }
    return c;
  }, [tasks]);

  const sidebarCategoryItems = useMemo(
    () => [
      { id: "all" as const, name: "All tasks" },
      ...categories.map((c) => ({ id: c.id, name: c.name })),
    ],
    [categories],
  );

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filterCategoryId !== "all" && t.category_id !== filterCategoryId) {
        return false;
      }
      if (!q) return true;
      const inTitle = t.title.toLowerCase().includes(q);
      const inDesc = t.description.toLowerCase().includes(q);
      return inTitle || inDesc;
    });
  }, [tasks, filterCategoryId, search]);

  async function handleStatusChange(id: string, status: TaskRow["status"]) {
    const prev = tasks;
    setTasks((rows) =>
      sortTasks(rows.map((r) => (r.id === id ? { ...r, status } : r))),
    );
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setLoadError(json.error ?? "Failed to update status");
        setTasks(prev);
      }
    } catch {
      setLoadError("Failed to update status");
      setTasks(prev);
    }
  }

  function requestDelete(task: TaskRow) {
    setTaskToDelete(task);
  }

  function requestEdit(task: TaskRow) {
    setTaskToEdit(task);
  }

  async function confirmDelete() {
    if (!taskToDelete) return;
    const id = taskToDelete.id;
    setDeleteSubmitting(true);
    const prev = tasks;
    setTasks((rows) => rows.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setLoadError(json.error ?? "Failed to delete");
        setTasks(prev);
      }
    } catch {
      setLoadError("Failed to delete");
      setTasks(prev);
    } finally {
      setDeleteSubmitting(false);
      setTaskToDelete(null);
    }
  }

  const navBtn =
    "flex size-11 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-900 hover:text-white";
  const navBtnActive = "bg-neutral-900 text-white";

  return (
    <div className="flex min-h-dvh bg-black text-white">
      <aside className="flex w-14 shrink-0 flex-col items-center border-r border-neutral-900 py-4">
        <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-neutral-900">
          <CheckSquare className="size-5 text-white" aria-hidden />
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="mb-6 flex size-11 items-center justify-center rounded-xl bg-white text-black transition hover:bg-neutral-200"
          aria-label="Add task"
        >
          <Plus className="size-5" />
        </button>
        <nav className="flex flex-1 flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("tasks")}
            className={`${navBtn} ${tab === "tasks" ? navBtnActive : ""}`}
            aria-label="Tasks"
            aria-current={tab === "tasks" ? "page" : undefined}
          >
            <List className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setTab("tracker")}
            className={`${navBtn} ${tab === "tracker" ? navBtnActive : ""}`}
            aria-label="Tracker"
            aria-current={tab === "tracker" ? "page" : undefined}
          >
            <BarChart2 className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={`${navBtn} ${tab === "categories" ? navBtnActive : ""}`}
            aria-label="Categories"
            aria-current={tab === "categories" ? "page" : undefined}
          >
            <Tags className="size-5" />
          </button>
        </nav>
        <button
          type="button"
          className={`${navBtn} mt-auto ${signingOut ? "opacity-40" : ""}`}
          disabled={signingOut}
          onClick={() => setSignOutOpen(true)}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </button>
      </aside>

      {tab === "tasks" ? (
        <aside className="hidden w-52 shrink-0 flex-col border-r border-neutral-900 py-6 pl-4 pr-3 md:flex">
          <h2 className="mb-6 text-sm font-semibold tracking-wide text-neutral-400">
            My tasks
          </h2>
          <ul className="flex flex-col gap-1">
            {sidebarCategoryItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setFilterCategoryId(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    filterCategoryId === item.id
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-400 hover:bg-neutral-950 hover:text-white"
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                    {counts[item.id] ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b border-neutral-900 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[200px] max-w-md flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search task"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              />
            </div>
            <div
              className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900 text-sm font-medium text-white"
              aria-hidden
            >
              {avatarUrl ? (
                // Google (and other) avatar hosts vary; avoid next/image allowlist churn.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                displayName.slice(0, 1).toUpperCase()
              )}
            </div>
          </div>
          <div className="flex min-h-[3.25rem] flex-wrap items-end justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {displayName}
            </h1>
            <div
              className={`flex shrink-0 items-center gap-1 rounded-xl border p-1 ${
                tab === "tasks"
                  ? "border-neutral-800"
                  : "pointer-events-none invisible border-transparent"
              }`}
              aria-hidden={tab !== "tasks"}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"}`}
                aria-label="Grid view"
                tabIndex={tab === "tasks" ? 0 : -1}
              >
                <LayoutGrid className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-2 ${viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"}`}
                aria-label="List view"
                tabIndex={tab === "tasks" ? 0 : -1}
              >
                <List className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`rounded-lg p-2 ${viewMode === "board" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"}`}
                aria-label="Board view"
                tabIndex={tab === "tasks" ? 0 : -1}
              >
                <Columns3 className="size-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-auto px-4 py-6 sm:px-6 lg:px-8">
          {tab === "tasks" ? (
            <div className="-mt-2 mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
              {sidebarCategoryItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterCategoryId(item.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
                    filterCategoryId === item.id
                      ? "border-white bg-white text-black"
                      : "border-neutral-700 bg-neutral-950 text-neutral-300"
                  }`}
                >
                  <span className="truncate">{item.name}</span>{" "}
                  <span className="text-neutral-500">
                    ({counts[item.id] ?? 0})
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {loadError ? (
            <div className="mb-4 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
              <p className="font-medium">Could not load tasks</p>
              <p className="mt-1 text-amber-200/80">{loadError}</p>
              <p className="mt-2 text-xs text-amber-200/60">
                In the Supabase SQL editor, run migrations in order:{" "}
                <code className="rounded bg-black/30 px-1">supabase/tasks.sql</code> (fresh
                projects), then{" "}
                <code className="rounded bg-black/30 px-1">supabase/m1_schema.sql</code>, then{" "}
                <code className="rounded bg-black/30 px-1">supabase/m2_tasks_user_id.sql</code>{" "}
                (<code className="rounded bg-black/30 px-1">user_id</code>), then{" "}
                <code className="rounded bg-black/30 px-1">supabase/m3_categories.sql</code>{" "}
                (categories + <code className="rounded bg-black/30 px-1">category_id</code> on
                tasks).
              </p>
            </div>
          ) : null}

          {tab === "tracker" ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/50 px-6 py-20 text-center">
              <BarChart2 className="mb-4 size-12 text-neutral-600" />
              <p className="text-lg font-medium text-neutral-300">Tracker</p>
              <p className="mt-2 max-w-sm text-sm text-neutral-500">
                Weekly stats and charts will go here (M3). Nothing to show yet.
              </p>
            </div>
          ) : tab === "categories" ? (
            <CategoriesManager
              onCategoriesChanged={() => {
                void loadCategories();
                void loadTasks();
              }}
            />
          ) : loading ? (
            <p className="text-neutral-500">Loading tasks…</p>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/50 px-6 py-16 text-center">
              <p className="text-neutral-400">No tasks match this view.</p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
              >
                Create a task
              </button>
            </div>
          ) : viewMode === "board" ? (
            <TasksBoardView
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onEditRequest={requestEdit}
              onDeleteRequest={requestDelete}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  layout="grid"
                  onStatusChange={handleStatusChange}
                  onDeleteRequest={requestDelete}
                  onEditRequest={requestEdit}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  layout="list"
                  onStatusChange={handleStatusChange}
                  onDeleteRequest={requestDelete}
                  onEditRequest={requestEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          void loadTasks();
          void loadCategories();
        }}
        categories={categories}
      />
      <EditTaskDialog
        task={taskToEdit}
        open={!!taskToEdit}
        onClose={() => setTaskToEdit(null)}
        categories={categories}
        onSaved={(updated) => {
          setTasks((rows) =>
            sortTasks(rows.map((r) => (r.id === updated.id ? updated : r))),
          );
          setTaskToEdit(null);
          void loadCategories();
        }}
      />
      <DeleteTaskDialog
        task={taskToDelete}
        deleting={deleteSubmitting}
        onClose={() => !deleteSubmitting && setTaskToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
      <SignOutDialog
        open={signOutOpen}
        signingOut={signingOut}
        onClose={() => !signingOut && setSignOutOpen(false)}
        onConfirm={() => void confirmSignOut()}
      />
    </div>
  );
}
