import { createAdminClient } from "@/lib/supabase/admin";

export async function categoryOwnedByUser(
  userId: string,
  categoryId: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return true;
}
