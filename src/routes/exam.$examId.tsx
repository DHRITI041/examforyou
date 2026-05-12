import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, EyeOff, Eye, Pause, Play, ChevronLeft, ChevronRight, Check, Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exam/$examId")({
  component: ExamPage,
});

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  position: number;
};

type Exam = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
};

function ExamPage() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const [examRes, qRes] = await Promise.all([
        supabase.from("exams").select("id,title,subject,duration_minutes").eq("id", examId).single(),
        supabase.from("questions").select("id,question_text,options,correct_index,position").eq("exam_id", examId).order("position"),
      ]);
      if (examRes.error) throw examRes.error;
      if (qRes.error) throw qRes.error;
      return {
        exam: examRes.data as Exam,
        questions: (qRes.data ?? []).map((q: any) => ({ ...q, options: q.options as string[] })) as Question[],
      };
    },
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timerOn, setTimerOn] = useState(true);
  const [timerVisible, setTimerVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (data?.exam && !startedRef.current) {
      setSecondsLeft(data.exam.duration_minutes * 60);
      startedRef.current = true;
    }
  }, [data?.exam]);

  useEffect(() => {
    if (!timerOn || paused || submitted || secondsLeft === null) return;
    if (secondsLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, timerOn, paused, submitted]);

  const formatted = useMemo(() => {
    if (secondsLeft === null) return "--:--";
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    const h = Math.floor(secondsLeft / 3600);
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }, [secondsLeft]);

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-6 py-20"><div className="h-96 rounded-lg bg-muted animate-pulse" /></div>;
  }
  if (!data?.exam) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center"><p>Exam not found.</p></div>;
  }

  const { exam, questions } = data;

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl">{exam.title}</h1>
        <p className="mt-3 text-muted-foreground">This exam has no questions yet.</p>
        <Link to="/admin/exam/$examId" params={{ examId }} className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-primary-foreground font-medium">Add questions</Link>
      </div>
    );
  }

  function handleSubmit() {
    setSubmitted(true);
    setTimerOn(false);
    toast.success("Submitted!");
  }

  if (submitted) {
    const correct = questions.filter(q => answers[q.id] === q.correct_index).length;
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Results</div>
        <h1 className="font-display text-4xl mt-2">{exam.title}</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Score" value={`${correct} / ${questions.length}`} />
          <Stat label="Percentage" value={`${pct}%`} />
          <Stat label="Subject" value={exam.subject} />
        </div>
        <div className="mt-10 space-y-4">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correct_index;
            return (
              <div key={q.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <span className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isCorrect ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{q.question_text}</p>
                    <div className="mt-3 grid gap-1.5 text-sm">
                      {q.options.map((opt, idx) => (
                        <div key={idx} className={`rounded px-3 py-1.5 ${idx === q.correct_index ? "bg-success/10 text-foreground" : idx === userAns ? "bg-destructive/10" : "text-muted-foreground"}`}>
                          {String.fromCharCode(65 + idx)}. {opt || <em className="opacity-50">empty</em>}
                          {idx === q.correct_index && <span className="ml-2 text-xs font-medium text-success">correct</span>}
                          {idx === userAns && idx !== q.correct_index && <span className="ml-2 text-xs font-medium text-destructive">your answer</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex gap-3">
          <button onClick={() => navigate({ to: "/" })} className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground font-medium">Back to exams</button>
          <button onClick={() => window.location.reload()} className="rounded-md border border-border px-5 py-2.5 font-medium hover:bg-muted">Retake</button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{exam.subject}</div>
          <h1 className="font-display text-2xl mt-0.5">{exam.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {timerVisible && (
            <div className={`flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-lg ${secondsLeft !== null && secondsLeft < 60 ? "border-destructive text-destructive" : "border-border"}`}>
              <Clock className="h-4 w-4" />
              {timerOn ? formatted : <span className="text-muted-foreground">off</span>}
            </div>
          )}
          <button
            onClick={() => setPaused(p => !p)}
            disabled={!timerOn}
            title={paused ? "Resume" : "Pause"}
            className="rounded-md border border-border p-2 hover:bg-muted disabled:opacity-40"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setTimerVisible(v => !v)}
            title={timerVisible ? "Hide timer" : "Show timer"}
            className="rounded-md border border-border p-2 hover:bg-muted"
          >
            {timerVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { setTimerOn(o => !o); }}
            title="Toggle timer on/off"
            className={`rounded-md border px-3 py-2 text-xs font-medium ${timerOn ? "border-border hover:bg-muted" : "border-accent bg-accent text-accent-foreground"}`}
          >
            {timerOn ? "Remove timer" : "Timer off"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_220px]">
        {/* Question */}
        <div>
          <div className="text-sm text-muted-foreground">
            Question {current + 1} of {questions.length}
          </div>
          <div className="mt-3 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <p className="text-lg font-medium leading-relaxed">{q.question_text}</p>
            <div className="mt-6 space-y-2.5">
              {q.options.map((opt, idx) => {
                const selected = answers[q.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: idx }))}
                    className={`w-full text-left rounded-md border-2 px-4 py-3 transition flex items-center gap-3 ${selected ? "border-accent bg-accent/10" : "border-border hover:border-foreground/30"}`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${selected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt || <em className="opacity-40">empty option</em>}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2 disabled:opacity-40 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            {current === questions.length - 1 ? (
              <button onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 font-medium text-accent-foreground hover:opacity-90">
                <Flag className="h-4 w-4" /> Submit exam
              </button>
            ) : (
              <button
                onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="rounded-lg border border-border bg-card p-4 h-fit">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigator</div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {questions.map((qq, i) => {
              const answered = answers[qq.id] !== undefined;
              const isCurrent = i === current;
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={`h-9 rounded text-sm font-medium transition ${
                    isCurrent ? "bg-primary text-primary-foreground"
                    : answered ? "bg-accent/30 text-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </div>
          <button onClick={handleSubmit} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
            <Check className="h-4 w-4" /> Submit
          </button>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl">{value}</div>
    </div>
  );
}
