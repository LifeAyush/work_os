import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth/api-session";
import type { RecurringTaskWithCompletion } from "@/lib/recurring/constants";
import { activePeriodKey } from "@/lib/recurring/period-key";
import { parseRecurringFrequency } from "@/lib/recurring/validation";
import { createAdminClient } from "@/lib/supabase/admin";

function rowFromDb(r: Record<string, unknown>): {
  id: string;
  user_id: string;
  title: string;
  frequency: string;
  created_at: string;
  updated_at: string;
} {
  return {
    id: String(r.id),
    user_id: String(r.user_id ?? ""),
    title: String(r.title ?? ""),
    frequency: String(r.frequency ?? ""),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

export async function GET() {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  try {
    const supabase = createAdminClient();
    const { data: tasksRaw, error: tasksError } = await supabase
      .from("recurring_tasks")
      .select("id, user_id, title, frequency, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    const tasks = (tasksRaw ?? []).map((r) =>
      rowFromDb(r as Record<string, unknown>),
    );
    const freqParsed = tasks.map((t) => parseRecurringFrequency(t.frequency));
    const out: RecurringTaskWithCompletion[] = [];

    if (tasks.length === 0) {
      return NextResponse.json({ routines: out });
    }

    const activeKeys = [
      ...new Set(
        tasks.map((t, i) => {
          const f = freqParsed[i];
          return f ? activePeriodKey(f) : "";
        }),
      ),
    ].filter(Boolean);

    const ids = tasks.map((t) => t.id);

    const { data: compRaw, error: compError } = await supabase
      .from("recurring_task_completions")
      .select("recurring_task_id, period_key, done")
      .eq("user_id", userId)
      .in("recurring_task_id", ids)
      .in("period_key", activeKeys);

    if (compError) {
      return NextResponse.json({ error: compError.message }, { status: 500 });
    }

    const completionMap = new Map<string, boolean>();
    for (const c of compRaw ?? []) {
      const row = c as {
        recurring_task_id: string;
        period_key: string;
        done: boolean;
      };
      completionMap.set(
        `${row.recurring_task_id}\0${row.period_key}`,
        row.done,
      );
    }

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const f = freqParsed[i];
      if (!f) continue;
      const active_period_key = activePeriodKey(f);
      const key = `${t.id}\0${active_period_key}`;
      const effective_done = completionMap.get(key) === true;
      out.push({
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        frequency: f,
        created_at: t.created_at,
        updated_at: t.updated_at,
        active_period_key,
        effective_done,
      });
    }

    return NextResponse.json({ routines: out });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const frequency = parseRecurringFrequency(
      typeof body.frequency === "string" ? body.frequency : "",
    );

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!frequency) {
      return NextResponse.json(
        { error: "frequency must be daily, weekly, or monthly" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recurring_tasks")
      .insert({
        user_id: userId,
        title,
        frequency,
        updated_at: now,
      })
      .select("id, user_id, title, frequency, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const t = rowFromDb(data as Record<string, unknown>);
    const f = parseRecurringFrequency(t.frequency);
    if (!f) {
      return NextResponse.json(
        { error: "invalid frequency after create" },
        { status: 500 },
      );
    }
    const active_period_key = activePeriodKey(f);
    const routine: RecurringTaskWithCompletion = {
      id: t.id,
      user_id: t.user_id,
      title: t.title,
      frequency: f,
      created_at: t.created_at,
      updated_at: t.updated_at,
      active_period_key,
      effective_done: false,
    };

    return NextResponse.json({ routine });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
