import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type Profile = { display_name: string | null; avatar_url: string | null };

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer DB calls
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadUserData(data.session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string) {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("display_name,avatar_url").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(p.data ?? null);
    setIsAdmin(!!r.data?.some((x: any) => x.role === "admin"));
  }

  async function signInGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) throw result.error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session, profile, isAdmin, isLoading, signInGoogle, signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
