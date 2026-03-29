"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/");
      }
    });
  }, [router]);

  async function signInWithGoogle() {
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950/80 p-8 shadow-xl">
        <h1 className="text-center text-xl font-semibold tracking-tight">
          Work OS
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          Sign in to open your workspace
        </p>
        {authError ? (
          <p className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-center text-sm text-amber-100">
            Sign-in did not complete. Try again.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-white py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {busy ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
