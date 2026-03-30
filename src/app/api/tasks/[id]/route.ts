import { NextResponse } from "next/server";

import { categoryOwnedByUser } from "@/lib/categories/verify";
import { requireSessionUser } from "@/lib/auth/api-session";
import type { TaskRow } from "@/lib/tasks/constants";
import {
  TASK_SELECT_WITH_CATEGORY,
  taskRowFromDb,
} from "@/lib/tasks/task-db";
import {
  attachmentsFromTextarea,
  isValidYMD,
  parsePriority,
  parseTaskStatus,
  parseUuid,
} from "@/lib/tasks/validation";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) {
        return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
      }
      patch.title = t;
    }
    if (typeof body.description === "string") patch.description = body.description;
    if (typeof body.attachments === "string") {
      patch.attachments = attachmentsFromTextarea(body.attachments);
    }
    if (typeof body.due_at === "string" && body.due_at.trim()) {
      const ymd = body.due_at.trim();
      if (!isValidYMD(ymd)) {
        return NextResponse.json(
          { error: "due_at must be YYYY-MM-DD" },
          { status: 400 },
        );
      }
      patch.due_at = `${ymd}T00:00:00.000Z`;
    }
    if (typeof body.status === "string") {
      const s = parseTaskStatus(body.status);
      if (!s) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      patch.status = s;
    }
    if (typeof body.priority === "string") {
      const p = parsePriority(body.priority);
      if (!p) {
        return NextResponse.json({ error: "invalid priority" }, { status: 400 });
      }
      patch.priority = p;
    }
    if (typeof body.category_id === "string") {
      const cid = parseUuid(body.category_id);
      if (!cid) {
        return NextResponse.json({ error: "invalid category_id" }, { status: 400 });
      }
      const owned = await categoryOwnedByUser(userId, cid);
      if (!owned) {
        return NextResponse.json(
          { error: "invalid or forbidden category_id" },
          { status: 403 },
        );
      }
      patch.category_id = cid;
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select(TASK_SELECT_WITH_CATEGORY)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    let task: TaskRow;
    try {
      task = taskRowFromDb(data as Record<string, unknown>);
    } catch {
      return NextResponse.json(
        { error: "Task data is missing category embed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ task });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tasks")
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
