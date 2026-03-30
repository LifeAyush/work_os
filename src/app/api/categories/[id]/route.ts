import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth/api-session";
import type { CategoryRow } from "@/lib/tasks/constants";
import { hexColorOrDefault, normalizeHexColor } from "@/lib/tasks/validation";
import { createAdminClient } from "@/lib/supabase/admin";

function rowFromDb(r: Record<string, unknown>): CategoryRow {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    slug: String(r.slug ?? ""),
    color_hex: hexColorOrDefault(String(r.color_hex ?? "")),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? r.created_at ?? ""),
  };
}

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

    if (typeof body.name === "string") {
      const n = body.name.trim();
      if (!n) {
        return NextResponse.json({ error: "name cannot be empty" }, {
          status: 400,
        });
      }
      patch.name = n;
    }
    if (typeof body.color_hex === "string") {
      const c = normalizeHexColor(body.color_hex.trim());
      if (!c) {
        return NextResponse.json(
          { error: "color_hex must be a valid #RRGGBB value" },
          { status: 400 },
        );
      }
      patch.color_hex = c;
    }

    const hasUpdate =
      typeof body.name === "string" || typeof body.color_hex === "string";
    if (!hasUpdate) {
      return NextResponse.json({ error: "no valid fields to update" }, {
        status: 400,
      });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({
      category: rowFromDb(data as Record<string, unknown>),
    });
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

    const { count, error: countErr } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("category_id", id);

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "This category is used by one or more tasks. Reassign or delete those tasks first.",
        },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("categories")
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
