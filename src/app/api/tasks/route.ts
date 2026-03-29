import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth/api-session";
import type { PrimaryTag, TaskRow, TaskStatus } from "@/lib/tasks/constants";
import { sortTasks } from "@/lib/tasks/sort";
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

export async function GET(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") ?? "all";

  try {
    const supabase = createAdminClient();
    let q = supabase.from("tasks").select("*").eq("user_id", userId);
    if (tag !== "all") {
      q = q.eq("primary_tag", tag);
    }
    const { data, error } = await q;
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }
    const rows = (data ?? []).map((r) =>
      rowFromDb(r as Record<string, unknown>),
    );
    return NextResponse.json({ tasks: sortTasks(rows) });
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
    const dueRaw = typeof body.due_at === "string" ? body.due_at.trim() : "";

    const status = parseTaskStatus(
      typeof body.status === "string" ? body.status : "",
    );
    const priority = parsePriority(
      typeof body.priority === "string" ? body.priority : "",
    );
    const primary_tag = parsePrimaryTag(
      typeof body.primary_tag === "string" ? body.primary_tag : "",
    );

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!dueRaw) {
      return NextResponse.json({ error: "due_at is required" }, { status: 400 });
    }
    if (!isOnOrAfterTodayYMD(dueRaw)) {
      return NextResponse.json(
        { error: "due_at must be today or a future date" },
        { status: 400 },
      );
    }
    if (!status || !priority || !primary_tag) {
      return NextResponse.json(
        { error: "status, priority, and primary_tag must be valid" },
        { status: 400 },
      );
    }

    const description =
      typeof body.description === "string" ? body.description : "";
    const attachmentsRaw =
      typeof body.attachments === "string" ? body.attachments : "";
    const attachments = attachmentsFromTextarea(attachmentsRaw);

    const due_at = `${dueRaw}T00:00:00.000Z`;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        status,
        priority,
        primary_tag,
        due_at,
        description,
        attachments,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      task: rowFromDb(data as Record<string, unknown>),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
