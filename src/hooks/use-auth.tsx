import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/* =========================
   ADMIN EMAIL
========================= */

const ADMIN_EMAIL =
  "dhriti.haringhata@gmail.com";

/* =========================
   TYPES
========================= */

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

/* =========================
   CONTEXT
========================= */

const Ctx =
  createContext<AuthCtx | null>(null);

/* =========================
   PROVIDER
========================= */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    // Listen for auth changes
    const { data: sub } =
      supabase.auth.onAuthStateChange(
        (_event, s) => {
          setSession(s);

          if (s?.user) {
            setTimeout(() => {
              loadUserData(s.user.id);
            }, 0);
          } else {
            setProfile(null);
            setIsAdmin(false);
          }
        }
      );

    // Check existing session
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);

        if (data.session?.user) {
          await loadUserData(
            data.session.user.id
          );
        }

        setIsLoading(false);
      });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  /* =========================
     LOAD USER DATA
  ========================= */

  async function loadUserData(
    userId: string
  ) {
    try {
      // Get profile
      const profileResult =
        await supabase
          .from("profiles")
          .select(
            "display_name, avatar_url"
          )
          .eq("user_id", userId)
          .maybeSingle();

      setProfile(
        profileResult.data ?? null
      );

      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Current email
      const email =
        user?.email
          ?.trim()
          .toLowerCase() ?? "";

      // Admin check
      const admin =
        email ===
        ADMIN_EMAIL.toLowerCase();

      setIsAdmin(admin);

      // Debug logs
      console.log(
        "Logged in email:",
        email
      );

      console.log(
        "Admin email:",
        ADMIN_EMAIL
      );

      console.log(
        "Is Admin:",
        admin
      );
    } catch (error) {
      console.error(
        "Failed to load user data:",
        error
      );
    }
  }

  /* =========================
     GOOGLE LOGIN
  ========================= */

  async function signInGoogle() {
    const result =
      await lovable.auth.signInWithOAuth(
        "google",
        {
          redirect_uri:
            "http://localhost:8081",
        }
      );

    if (result.error) {
      throw result.error;
    }
  }

  /* =========================
     LOGOUT
  ========================= */

  async function signOut() {
    await supabase.auth.signOut();
  }

  /* =========================
     PROVIDER VALUE
  ========================= */

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        isAdmin,
        isLoading,
        signInGoogle,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useAuth() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}
