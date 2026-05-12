import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/auth-gate";
import { LogOut } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">This page doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-display">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MOCKS — Free JEE & NEET Practice Exams" },
      { name: "description", content: "Free, open practice tests for JEE, NEET and more. Editable exams, removable timer, no signup." },
      { property: "og:title", content: "MOCKS — Free JEE & NEET Practice Exams" },
      { property: "og:description", content: "Free, open practice tests for JEE, NEET and more. Editable exams, removable timer, no signup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "MOCKS — Free JEE & NEET Practice Exams" },
      { name: "twitter:description", content: "Free, open practice tests for JEE, NEET and more. Editable exams, removable timer, no signup." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/igLKnHUCFIVywKDgzaJkH3lyHi32/social-images/social-1778595934991-Gemini_Generated_Image_z42ua2z42ua2z42u.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/igLKnHUCFIVywKDgzaJkH3lyHi32/social-images/social-1778595934991-Gemini_Generated_Image_z42ua2z42ua2z42u.webp" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-lg">T</div>
          <span className="font-display text-xl font-semibold">TestKart</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" activeOptions={{ exact: true }} className="rounded-md px-3 py-2 hover:bg-muted [&.active]:font-semibold" activeProps={{ className: "active" }}>Exams</Link>
          {isAdmin && (
            <Link to="/admin" className="rounded-md px-3 py-2 hover:bg-muted [&.active]:font-semibold" activeProps={{ className: "active" }}>Admin</Link>
          )}
          <Link to="/about" className="rounded-md px-3 py-2 hover:bg-muted [&.active]:font-semibold" activeProps={{ className: "active" }}>About</Link>
          {user && (
            <div className="ml-3 flex items-center gap-2 border-l border-border pl-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-secondary text-xs flex items-center justify-center font-semibold">
                  {(profile?.display_name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <button onClick={() => signOut()} title="Sign out" className="rounded-md p-2 hover:bg-muted">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1"><Outlet /></main>
            <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
              Free & open. Built for JEE, NEET and the curious.
            </footer>
          </div>
        </AuthGate>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
