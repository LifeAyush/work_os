"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { CategoryRow } from "@/lib/tasks/constants";
import { CATEGORY_COLOR_PRESETS } from "@/lib/tasks/constants";
import { accentFromHex } from "@/lib/tasks/tag-styles";
import { normalizeHexColor } from "@/lib/tasks/validation";

const DEFAULT_HEX = "#71717a";

type ColorHexFieldsProps = {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  idPrefix: string;
};

function ColorHexFields({ value, onChange, disabled, idPrefix }: ColorHexFieldsProps) {
  const safeForPicker = normalizeHexColor(value) ?? DEFAULT_HEX;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_COLOR_PRESETS.map((h) => (
          <button
            key={h}
            type="button"
            disabled={disabled}
            onClick={() => onChange(h)}
            className="size-8 rounded-lg border border-neutral-700 transition hover:scale-105 disabled:opacity-40"
            style={{ backgroundColor: h }}
            title={h}
            aria-label={`Preset ${h}`}
          />
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        <span>Hex</span>
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const n = normalizeHexColor(value);
            if (n) onChange(n);
            else onChange(DEFAULT_HEX);
          }}
          placeholder="#RRGGBB"
          spellCheck={false}
          className="h-10 w-full rounded-lg border border-neutral-700 bg-black px-3 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        <span>Picker</span>
        <input
          id={`${idPrefix}-color`}
          type="color"
          disabled={disabled}
          value={safeForPicker}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full max-w-[5.5rem] cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 disabled:opacity-40"
          aria-label="Color picker"
        />
      </label>
    </div>
  );
}

type Props = {
  onCategoriesChanged?: () => void;
};

export function CategoriesManager({ onCategoriesChanged }: Props) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newColorHex, setNewColorHex] = useState(DEFAULT_HEX);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColorHex, setEditColorHex] = useState(DEFAULT_HEX);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const json = (await res.json()) as {
        categories?: CategoryRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Failed to load categories");
        setCategories([]);
        return;
      }
      setCategories(json.categories ?? []);
    } catch {
      setError("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function notifyChanged() {
    onCategoriesChanged?.();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const color_hex = normalizeHexColor(newColorHex) ?? DEFAULT_HEX;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color_hex }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to create");
        return;
      }
      setNewName("");
      setNewColorHex(DEFAULT_HEX);
      await load();
      notifyChanged();
    } finally {
      setCreating(false);
    }
  }

  function openEdit(c: CategoryRow) {
    setEditing(c);
    setEditName(c.name);
    setEditColorHex(c.color_hex);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const name = editName.trim();
    if (!name) return;
    const color_hex = normalizeHexColor(editColorHex) ?? DEFAULT_HEX;
    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color_hex }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to update");
        return;
      }
      setEditing(null);
      await load();
      notifyChanged();
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to delete");
        return;
      }
      await load();
      notifyChanged();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="text-neutral-500">Loading categories…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Categories</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Organize tasks with custom categories. Pick any accent color (stored
          as #RRGGBB).
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        <form
          onSubmit={handleCreate}
          className="w-full shrink-0 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 md:max-w-[20rem] lg:sticky lg:top-4"
        >
          <h3 className="mb-3 text-sm font-medium text-neutral-300">New category</h3>
          <div className="flex flex-col gap-4">
            <label className="text-sm">
              <span className="mb-1 block text-neutral-400">Name</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Client work"
                className="h-10 w-full rounded-lg border border-neutral-700 bg-black px-3 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600/40"
              />
            </label>
            <div>
              <span className="mb-2 block text-sm text-neutral-400">Color</span>
              <ColorHexFields
                idPrefix="new"
                value={newColorHex}
                onChange={setNewColorHex}
                disabled={creating}
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              <Plus className="size-4" />
              Add
            </button>
          </div>
        </form>

        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {categories.map((c) => {
              const accent = accentFromHex(c.color_hex, c.name);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={accent.lineStyle}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{c.name}</p>
                      <p className="font-mono text-xs text-neutral-500">{c.color_hex}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-900 hover:text-white"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-900 hover:text-red-400 disabled:opacity-40"
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 px-4 py-8 text-center text-sm text-neutral-500">
              No categories yet. Add one using the form on the left, or run{" "}
              <code className="rounded bg-neutral-900 px-1 text-xs">
                supabase/m3_categories.sql
              </code>{" "}
              if you expected defaults.
            </p>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => !savingEdit && setEditing(null)}
          />
          <form
            onSubmit={handleSaveEdit}
            className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Edit category</h3>
              <button
                type="button"
                onClick={() => !savingEdit && setEditing(null)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-sm">
                <span className="mb-1 block text-neutral-400">Name</span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-neutral-700 bg-black px-3 text-sm text-white focus:border-neutral-500 focus:outline-none"
                />
              </label>
              <div>
                <span className="mb-2 block text-sm text-neutral-400">Color</span>
                <ColorHexFields
                  idPrefix="edit"
                  value={editColorHex}
                  onChange={setEditColorHex}
                  disabled={savingEdit}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !savingEdit && setEditing(null)}
                  className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editName.trim()}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  {savingEdit ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
