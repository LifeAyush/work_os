import { NextResponse } from "next/server";

import { categoryOwnedByUser } from "@/lib/categories/verify";
import { requireSessionUser } from "@/lib/auth/api-session";
import type { TaskRow } from "@/lib/tasks/constants";
import {
  TASK_SELECT_WITH_CATEGORY,
  taskRowFromDb,
} from "@/lib/tasks/task-db";
import { sortTasks } from "@/lib/tasks/sort";
import {
  attachmentsFromTextarea,
  isOnOrAfterTodayYMD,
  parsePriority,
  parseTaskStatus,
  parseUuid,
} from "@/lib/tasks/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category_id") ?? "all";

  try {
    const supabase = createAdminClient();
    let q = supabase
      .from("tasks")
      .select(TASK_SELECT_WITH_CATEGORY)
      .eq("user_id", userId);
    if (categoryParam !== "all") {
      const cid = parseUuid(categoryParam);
      if (!cid) {
        return NextResponse.json(
          { error: "invalid category_id" },
          { status: 400 },
        );
      }
      q = q.eq("category_id", cid);
    }
    const { data, error } = await q;
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }
    const rows: TaskRow[] = [];
    for (const r of data ?? []) {
      try {
        rows.push(taskRowFromDb(r as Record<string, unknown>));
      } catch {
        return NextResponse.json(
          {
            error:
              "Task data is missing categories. Run supabase/m3_categories.sql on your database.",
          },
          { status: 500 },
        );
      }
    }
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
    const categoryId = parseUuid(
      typeof body.category_id === "string" ? body.category_id : "",
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
    if (!status || !priority || !categoryId) {
      return NextResponse.json(
        { error: "status, priority, and category_id must be valid" },
        { status: 400 },
      );
    }

    const owned = await categoryOwnedByUser(userId, categoryId);
    if (!owned) {
      return NextResponse.json(
        { error: "invalid or forbidden category_id" },
        { status: 403 },
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
        category_id: categoryId,
        due_at,
        description,
        attachments,
        updated_at: new Date().toISOString(),
      })
      .select(TASK_SELECT_WITH_CATEGORY)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let task: TaskRow;
    try {
      task = taskRowFromDb(data as Record<string, unknown>);
    } catch {
      return NextResponse.json(
        { error: "Failed to load task category after create" },
        { status: 500 },
      );
    }

    return NextResponse.json({ task });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
