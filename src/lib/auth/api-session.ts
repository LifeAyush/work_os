import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function allowedEmailSet(): Set<string> | null {
  const raw = process.env.ALLOWED_GOOGLE_EMAIL?.trim();
  if (!raw) return null;
  const set = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  if (set.size === 0) return null;
  return set;
}

export async function requireSessionUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const allowed = allowedEmailSet();
  if (!allowed) {
    return { ok: true, userId: user.id };
  }

  const email = user.email?.toLowerCase();
  if (!email || !allowed.has(email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
