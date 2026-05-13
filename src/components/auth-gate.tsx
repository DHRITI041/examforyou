import { useState, useCallback, useEffect, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Map a user-typed login id to a real email Supabase will accept.
// Rules:
//  - "dhriti@admin"  -> "dhriti@admin.app"  (special admin id, transparent)
//  - "name@host" with no dot in host -> "name@host.app"
//  - anything else used as-is (assumed to be a real email)
export function normalizeLoginId(raw: string): string {
  const id = raw.trim().toLowerCase();
  if (!id.includes("@")) return id;
  const [local, host] = id.split("@");
  if (!host) return id;
  if (!host.includes(".")) return `${local}@${host}.app`;
  return id;
}

async function ensureAdminAccount() {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ensure-admin`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // best effort; ignore
  }
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, signInGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Bootstrap the protected admin account once on first paint.
  useEffect(() => {
    ensureAdminAccount();
  }, []);

  const handleGoogle = useCallback(async () => {
    try {
      setIsSigningIn(true);
      await signInGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      toast.error(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [signInGoogle]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onGoogle={handleGoogle} isSigningIn={isSigningIn} />;
  }

  return (
    <>
      {isAdmin && (
        <div className="fixed right-4 top-4 z-50 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow">
          ADMIN
        </div>
      )}
      {children}
    </>
  );
}

function LoginScreen({
  onGoogle,
  isSigningIn,
}: {
  onGoogle: () => void;
  isSigningIn: boolean;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      toast.error("Enter id and password");
      return;
    }
    setBusy(true);
    try {
      const email = normalizeLoginId(id);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email },
          },
        });
        if (error) throw error;
        toast.success("Account created — signing you in…");
        // Auto-confirm is on, attempt immediate sign-in.
        await supabase.auth.signInWithPassword({ email, password });
      } else {
        // Make sure the protected admin exists if user is trying to log in as admin.
        if (email === "dhriti@admin.app") await ensureAdminAccount();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-background/95 p-8 shadow-2xl backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="mt-5 font-display text-3xl">
          {mode === "signin" ? "Sign in to TestKart" : "Create your account"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Free practice exams for JEE, NEET and more.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="text"
            autoComplete="username"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="ID or email (e.g. dhriti@admin)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:underline"
        >
          {mode === "signin"
            ? "No account? Create one"
            : "Already have an account? Sign in"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OR
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={isSigningIn}
          aria-label="Continue with Google"
          className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
        >
          {isSigningIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
          {isSigningIn ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="mt-4 text-xs text-muted-foreground">
          By continuing you agree to our terms.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.227c1.886-1.738 2.986-4.297 2.986-7.351z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.227-2.51c-.895.6-2.04.955-3.391.955-2.605 0-4.81-1.76-5.595-4.123H3.073v2.59A9.997 9.997 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.405 13.9a6.014 6.014 0 0 1 0-3.8V7.51H3.073a10.005 10.005 0 0 0 0 8.98l3.332-2.59z" />
      <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.866-2.866C16.96 3.005 14.696 2 12 2A9.997 9.997 0 0 0 3.073 7.51l3.332 2.59C7.19 7.737 9.395 5.977 12 5.977z" />
    </svg>
  );
}
