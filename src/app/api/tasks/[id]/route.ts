import { NextResponse } from "next/server";

import type { PrimaryTag, TaskRow, TaskStatus } from "@/lib/tasks/constants";
import {
  attachmentsFromTextarea,
  isOnOrAfterTodayYMD,
  parsePrimaryTag,
  parsePriority,
  parseTaskStatus,
} from "@/lib/tasks/validation";
import { createAdminClient } from "@/lib/supabase/admin";

function rowFromDb(r: Record<string, unknown>): TaskRow {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    status: String(r.status) as TaskStatus,
    primary_tag: String(r.primary_tag) as PrimaryTag,
    priority: String(r.priority) as TaskRow["priority"],
    due_at: r.due_at != null ? String(r.due_at) : null,
    description: String(r.description ?? ""),
    attachments: String(r.attachments ?? ""),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? r.created_at ?? ""),
  };
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.description === "string") patch.description = body.description;
    if (typeof body.attachments === "string") {
      patch.attachments = attachmentsFromTextarea(body.attachments);
    }
    if (typeof body.due_at === "string" && body.due_at.trim()) {
      const ymd = body.due_at.trim();
      if (!isOnOrAfterTodayYMD(ymd)) {
        return NextResponse.json(
          { error: "due_at must be today or a future date" },
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
    if (typeof body.primary_tag === "string") {
      const t = parsePrimaryTag(body.primary_tag);
      if (!t) {
        return NextResponse.json({ error: "invalid primary_tag" }, { status: 400 });
      }
      patch.primary_tag = t;
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({
      task: rowFromDb(data as Record<string, unknown>),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
