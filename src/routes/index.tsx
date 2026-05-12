import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, BookOpen, Globe2, ArrowRight, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Exam = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  duration_minutes: number;
};

function Index() {
  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id,title,subject,description,duration_minutes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Exam[];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }} />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28 text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Free for everyone, everywhere
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
            Practice JEE & NEET
            <span className="block italic" style={{ color: "var(--accent)" }}>without the paywall.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">
            Timed mock tests anyone can take. A removable timer for relaxed study, an open
            admin panel so you can build and edit exams — no code required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#exams" className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground shadow-[var(--shadow-glow)] hover:opacity-90 transition">
              Browse exams <ArrowRight className="h-4 w-4" />
            </a>
            <Link to="/admin" className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-5 py-3 font-medium hover:bg-white/10 transition">
              <Plus className="h-4 w-4" /> Create an exam
            </Link>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-3xl">
            {[
              { icon: Globe2, label: "Open access", text: "No signup, no fees." },
              { icon: Clock, label: "Timer your way", text: "Pause or hide it anytime." },
              { icon: BookOpen, label: "Editable", text: "Anyone can add questions." },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <Icon className="h-5 w-5 text-accent" />
                <div className="mt-3 font-semibold">{label}</div>
                <div className="text-sm text-white/60">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam list */}
      <section id="exams" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">All exams</div>
            <h2 className="font-display text-3xl md:text-4xl mt-1">Pick a test, start the clock</h2>
          </div>
          <Link to="/admin" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" /> Add new
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0,1,2,3].map(i => <div key={i} className="h-44 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : !exams?.length ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((e) => (
              <Link
                key={e.id}
                to="/exam/$examId"
                params={{ examId: e.id }}
                className="group relative rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:border-accent transition"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {e.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {e.duration_minutes} min
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl leading-tight">{e.title}</h3>
                {e.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                )}
                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                  Start exam <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
      <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 font-display text-2xl">No exams yet</h3>
      <p className="mt-2 text-muted-foreground">Be the first to create one — no coding needed.</p>
      <Link to="/admin" className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90">
        <Plus className="h-4 w-4" /> Create exam
      </Link>
    </div>
  );
}
