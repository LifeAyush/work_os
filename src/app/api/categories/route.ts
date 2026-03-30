import { NextResponse } from "next/server";

import { DEFAULT_CATEGORY_SEEDS } from "@/lib/categories/defaults";
import { requireSessionUser } from "@/lib/auth/api-session";
import type { CategoryRow } from "@/lib/tasks/constants";
import { hexColorOrDefault, normalizeHexColor, slugFromName } from "@/lib/tasks/validation";
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

async function ensureDefaultCategories(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createAdminClient();
  const { data: anyRow, error: checkErr } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (checkErr) {
    return { ok: false, message: checkErr.message };
  }
  if (anyRow?.length) return { ok: true };

  const rows = DEFAULT_CATEGORY_SEEDS.map((s) => ({
    user_id: userId,
    name: s.name,
    slug: s.slug,
    color_hex: s.color_hex,
    updated_at: new Date().toISOString(),
  }));
  const { error: insErr } = await supabase.from("categories").insert(rows);
  if (insErr) {
    return { ok: false, message: insErr.message };
  }
  return { ok: true };
}

export async function GET() {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  try {
    const seeded = await ensureDefaultCategories(userId);
    if (!seeded.ok) {
      return NextResponse.json({ error: seeded.message }, { status: 500 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const categories = (data ?? []).map((r) =>
      rowFromDb(r as Record<string, unknown>),
    );
    return NextResponse.json({ categories });
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const colorRaw =
      typeof body.color_hex === "string" ? body.color_hex.trim() : "";
    const color_hex = normalizeHexColor(colorRaw) ?? "#71717a";

    let base = slugFromName(name);
    if (!base) base = "category";

    const supabase = createAdminClient();
    for (let i = 0; i < 20; i++) {
      const trySlug = i === 0 ? base : `${base}-${i}`;
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          name,
          slug: trySlug,
          color_hex,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (!error && data) {
        return NextResponse.json({
          category: rowFromDb(data as Record<string, unknown>),
        });
      }
      if (
        error?.message?.includes("duplicate") ||
        error?.code === "23505"
      ) {
        continue;
      }
      return NextResponse.json({ error: error?.message ?? "insert failed" }, {
        status: 500,
      });
    }
    return NextResponse.json({ error: "could not allocate unique slug" }, {
      status: 500,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
