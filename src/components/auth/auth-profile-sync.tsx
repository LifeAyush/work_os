"use client";

import { useEffect } from "react";

import {
  clearStoredProfile,
  profileFromUser,
  writeStoredProfile,
} from "@/lib/auth/profile-storage";
import { createClient } from "@/lib/supabase/client";

export function AuthProfileSync() {
  useEffect(() => {
    const supabase = createClient();

    const sync = () => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        const user = session?.user;
        if (user) {
          writeStoredProfile(profileFromUser(user));
        } else {
          clearStoredProfile();
        }
      });
    };

    sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        clearStoredProfile();
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        writeStoredProfile(profileFromUser(session.user));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
