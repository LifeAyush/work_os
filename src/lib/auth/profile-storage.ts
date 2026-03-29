import type { User } from "@supabase/supabase-js";

export const PROFILE_STORAGE_KEY = "work_os_profile";

export type StoredProfile = {
  email: string | null;
  name: string | null;
  avatar_url: string | null;
};

export function profileFromUser(user: User): StoredProfile {
  const meta = user.user_metadata as Record<string, unknown>;
  const fullName =
    typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const nameField = typeof meta.name === "string" ? meta.name.trim() : "";
  const name =
    fullName || nameField || user.email?.split("@")[0]?.trim() || null;
  const avatar_url =
    typeof meta.avatar_url === "string" ? meta.avatar_url.trim() || null : null;
  return {
    email: user.email ?? null,
    name,
    avatar_url,
  };
}

export function readStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    return {
      email: typeof o.email === "string" ? o.email : null,
      name: typeof o.name === "string" ? o.name : null,
      avatar_url: typeof o.avatar_url === "string" ? o.avatar_url : null,
    };
  } catch {
    return null;
  }
}

export function writeStoredProfile(profile: StoredProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearStoredProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function displayLabel(
  profile: StoredProfile | null,
  fallback: string,
): string {
  if (!profile) return fallback;
  return profile.name?.trim() || profile.email?.trim() || fallback;
}
