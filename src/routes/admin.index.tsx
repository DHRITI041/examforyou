import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Pencil, Trash2, BookOpen, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — TestKart" }] }),
  component: Admin,
});

type Exam = {
  id: string; title: string; subject: string; description: string | null; duration_minutes: number;
};

function Admin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const { data: exams, isLoading } = useQuery({
    queryKey: ["admin-exams"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id,title,subject,description,duration_minutes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Exam[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "Physics", description: "", duration_minutes: 60 });

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { error } = await supabase.from("exams").insert({
      title: form.title, subject: form.subject, description: form.description || null, duration_minutes: form.duration_minutes,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Exam created");
    setOpen(false);
    setForm({ title: "", subject: "Physics", description: "", duration_minutes: 60 });
    qc.invalidateQueries({ queryKey: ["admin-exams"] });
    qc.invalidateQueries({ queryKey: ["exams"] });
  }

  async function deleteExam(id: string) {
    if (!confirm("Delete this exam and all its questions?")) return;
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-exams"] });
    qc.invalidateQueries({ queryKey: ["exams"] });
  }

  if (authLoading) return <div className="mx-auto max-w-5xl px-6 py-12"><div className="h-40 rounded-lg bg-muted animate-pulse" /></div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-2xl">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need admin permissions to access this page. Ask the platform owner to grant you the admin role.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Back to exams</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin</div>
          <h1 className="font-display text-4xl mt-1">Manage exams</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-primary-foreground font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> New exam
        </button>
      </div>

      {open && (
        <form onSubmit={createExam} className="mb-8 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] space-y-4">
          <h2 className="font-display text-xl">Create exam</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="JEE Main Mock 1" className={inputCls} />
            </Field>
            <Field label="Subject">
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" min={1} value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className={inputCls} />
            </Field>
            <Field label="Description (optional)">
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium">Create</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 font-medium hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <div className="h-40 rounded-lg bg-muted animate-pulse" />
        : !exams?.length ? (
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No exams yet. Create your first one.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {exams.map((e, i) => (
              <div key={e.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{e.subject}</span>
                    <span className="text-xs text-muted-foreground">{e.duration_minutes} min</span>
                  </div>
                  <div className="font-medium truncate mt-1">{e.title}</div>
                </div>
                <Link to="/admin/exam/$examId" params={{ examId: e.id }} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button onClick={() => deleteExam(e.id)} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
