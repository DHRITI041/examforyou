import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ShieldPlus, ShieldOff, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manage Admins — TestKart" }] }),
  component: ManageUsers,
});

type Row = {
  user_id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
};

function ManageUsers() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [granting, setGranting] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_users" as any);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setGranting(true);
    const { error } = await supabase.rpc("grant_admin" as any, {
      target_email: email.trim(),
    });
    setGranting(false);
    if (error) return toast.error(error.message);
    toast.success(`${email} is now an admin`);
    setEmail("");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function revoke(uid: string, label: string) {
    if (!confirm(`Revoke admin from ${label}?`)) return;
    const { error } = await supabase.rpc("revoke_admin" as any, {
      target_user_id: uid,
    });
    if (error) return toast.error(error.message);
    toast.success("Admin revoked");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-2xl">Admin only</h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to exams
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Admin
        </div>
        <h1 className="font-display text-4xl mt-1">Manage admins</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Promote any signed-in user to admin by their Google email.
        </p>
      </div>

      <form
        onSubmit={grant}
        className="mb-8 flex gap-2 rounded-lg border border-border bg-card p-4"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@gmail.com"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={granting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {granting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldPlus className="h-4 w-4" />
          )}
          Grant admin
        </button>
      </form>

      {isLoading ? (
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {(users ?? []).map((u, i) => {
            const label = u.display_name || u.email;
            const isSelf = u.user_id === user?.id;
            return (
              <div
                key={u.user_id}
                className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </div>
                </div>
                {u.is_admin ? (
                  <span className="rounded-full bg-green-600/15 text-green-700 dark:text-green-400 px-2.5 py-0.5 text-xs font-semibold">
                    Admin
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                    User
                  </span>
                )}
                {u.is_admin && !isSelf && (
                  <button
                    onClick={() => revoke(u.user_id, label)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <ShieldOff className="h-3.5 w-3.5" /> Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
