import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

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
  refreshRole: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles" as any)
        .select("display_name, avatar_url")
        .eq("user_id", uid)
        .maybeSingle(),
      supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", uid),
    ]);
    setProfile((prof as any) ?? null);
    setIsAdmin(
      Array.isArray(roles) &&
        roles.some((r: any) => r.role === "admin"),
    );
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        await loadUserData(data.session.user.id);
      }
      setIsLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  async function signInGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) throw result.error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshRole() {
    if (session?.user) await loadUserData(session.user.id);
  }

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
        refreshRole,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
