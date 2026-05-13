import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, signInGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = useCallback(async () => {
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
    return <LoginScreen onSignIn={handleSignIn} isSigningIn={isSigningIn} />;
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
  onSignIn,
  isSigningIn,
}: {
  onSignIn: () => void;
  isSigningIn: boolean;
}) {
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
          Sign in to TestKart
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Free practice exams for JEE, NEET and more — sign in with Google to
          start.
        </p>

        <button
          type="button"
          onClick={onSignIn}
          disabled={isSigningIn}
          aria-label="Continue with Google"
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
        >
          {isSigningIn ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon />
          )}

          {isSigningIn ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="mt-4 text-xs text-muted-foreground">
          By continuing you agree to our terms. We only store your name and
          avatar.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.227c1.886-1.738 2.986-4.297 2.986-7.351z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.227-2.51c-.895.6-2.04.955-3.391.955-2.605 0-4.81-1.76-5.595-4.123H3.073v2.59A9.997 9.997 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.9a6.014 6.014 0 0 1 0-3.8V7.51H3.073a10.005 10.005 0 0 0 0 8.98l3.332-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.866-2.866C16.96 3.005 14.696 2 12 2A9.997 9.997 0 0 0 3.073 7.51l3.332 2.59C7.19 7.737 9.395 5.977 12 5.977z"
      />
    </svg>
  );
}
