import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth/api-session";
import type { RecurringTaskWithCompletion } from "@/lib/recurring/constants";
import { activePeriodKey } from "@/lib/recurring/period-key";
import { parseRecurringFrequency } from "@/lib/recurring/validation";
import { parseUuid } from "@/lib/tasks/validation";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

async function loadRoutineForUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  id: string,
): Promise<{
  id: string;
  user_id: string;
  title: string;
  frequency: string;
  created_at: string;
  updated_at: string;
} | null> {
  const { data, error } = await supabase
    .from("recurring_tasks")
    .select("id, user_id, title, frequency, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    user_id: String(r.user_id ?? ""),
    title: String(r.title ?? ""),
    frequency: String(r.frequency ?? ""),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

function toResponseRoutine(
  t: {
    id: string;
    user_id: string;
    title: string;
    frequency: string;
    created_at: string;
    updated_at: string;
  },
  effective_done: boolean,
): RecurringTaskWithCompletion | null {
  const f = parseRecurringFrequency(t.frequency);
  if (!f) return null;
  const active_period_key = activePeriodKey(f);
  return {
    id: t.id,
    user_id: t.user_id,
    title: t.title,
    frequency: f,
    created_at: t.created_at,
    updated_at: t.updated_at,
    active_period_key,
    effective_done,
  };
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { id: rawId } = await ctx.params;
  const id = parseUuid(rawId ?? "");
  if (!id) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminClient();
    const existing = await loadRoutineForUser(supabase, userId, id);
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const hasDone = typeof body.done === "boolean";
    const hasTitle = typeof body.title === "string";
    const hasFrequency = typeof body.frequency === "string";

    if (!hasDone && !hasTitle && !hasFrequency) {
      return NextResponse.json(
        { error: "provide title, frequency, and/or done" },
        { status: 400 },
      );
    }

    let nextRow = existing;

    if (hasTitle || hasFrequency) {
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (hasTitle) {
        const t = (body.title as string).trim();
        if (!t) {
          return NextResponse.json(
            { error: "title cannot be empty" },
            { status: 400 },
          );
        }
        patch.title = t;
      }
      if (hasFrequency) {
        const f = parseRecurringFrequency(body.frequency as string);
        if (!f) {
          return NextResponse.json(
            { error: "frequency must be daily, weekly, or monthly" },
            { status: 400 },
          );
        }
        patch.frequency = f;
      }

      const { data, error } = await supabase
        .from("recurring_tasks")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id, user_id, title, frequency, created_at, updated_at")
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }
      const r = data as Record<string, unknown>;
      nextRow = {
        id: String(r.id),
        user_id: String(r.user_id ?? ""),
        title: String(r.title ?? ""),
        frequency: String(r.frequency ?? ""),
        created_at: String(r.created_at ?? ""),
        updated_at: String(r.updated_at ?? ""),
      };
    }

    const freq = parseRecurringFrequency(nextRow.frequency);
    if (!freq) {
      return NextResponse.json(
        { error: "invalid stored frequency" },
        { status: 500 },
      );
    }
    const activeKey = activePeriodKey(freq);

    if (hasDone) {
      const done = body.done as boolean;
      const now = new Date().toISOString();
      const { error: upError } = await supabase
        .from("recurring_task_completions")
        .upsert(
          {
            recurring_task_id: id,
            user_id: userId,
            period_key: activeKey,
            done,
            updated_at: now,
          },
          { onConflict: "recurring_task_id,period_key" },
        );

      if (upError) {
        return NextResponse.json({ error: upError.message }, { status: 500 });
      }
    }

    const { data: compRow } = await supabase
      .from("recurring_task_completions")
      .select("done")
      .eq("recurring_task_id", id)
      .eq("period_key", activeKey)
      .eq("user_id", userId)
      .maybeSingle();

    const effective_done =
      (compRow as { done?: boolean } | null)?.done === true;

    const routine = toResponseRoutine(nextRow, effective_done);
    if (!routine) {
      return NextResponse.json(
        { error: "failed to build response" },
        { status: 500 },
      );
    }

    return NextResponse.json({ routine });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { id: rawId } = await ctx.params;
  const id = parseUuid(rawId ?? "");
  if (!id) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recurring_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data?.length) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
