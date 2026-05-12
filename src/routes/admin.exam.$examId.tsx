import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Plus, Trash2, Save, Code2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exam/$examId")({
  head: () => ({ meta: [{ title: "Edit exam — TestKart" }] }),
  component: EditExam,
});

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  position: number;
};

function EditExam() {
  const { examId } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-exam", examId],
    queryFn: async () => {
      const [examRes, qRes] = await Promise.all([
        supabase.from("exams").select("*").eq("id", examId).single(),
        supabase.from("questions").select("*").eq("exam_id", examId).order("position"),
      ]);
      if (examRes.error) throw examRes.error;
      if (qRes.error) throw qRes.error;
      return {
        exam: examRes.data,
        questions: (qRes.data ?? []).map((q: any) => ({ ...q, options: q.options as string[] })) as Question[],
      };
    },
  });

  const [meta, setMeta] = useState({ title: "", subject: "", duration_minutes: 60, description: "" });
  useEffect(() => {
    if (data?.exam) setMeta({
      title: data.exam.title, subject: data.exam.subject,
      duration_minutes: data.exam.duration_minutes, description: data.exam.description ?? ""
    });
  }, [data?.exam]);

  async function saveMeta() {
    const { error } = await supabase.from("exams").update({
      title: meta.title, subject: meta.subject,
      duration_minutes: meta.duration_minutes,
      description: meta.description || null,
    }).eq("id", examId);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["admin-exam", examId] });
    qc.invalidateQueries({ queryKey: ["admin-exams"] });
    qc.invalidateQueries({ queryKey: ["exams"] });
  }

  async function addQuestion() {
    const nextPos = (data?.questions.length ?? 0);
    const { error } = await supabase.from("questions").insert({
      exam_id: examId,
      question_text: "New question",
      options: ["", "", "", ""],
      correct_index: 0,
      position: nextPos,
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-exam", examId] });
  }

  async function updateQuestion(q: Question) {
    const { error } = await supabase.from("questions").update({
      question_text: q.question_text,
      options: q.options,
      correct_index: q.correct_index,
    }).eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success("Question saved");
    qc.invalidateQueries({ queryKey: ["admin-exam", examId] });
  }

  async function bulkImport(parsed: ParsedQ[], replace: boolean) {
    if (replace) {
      const { error: delErr } = await supabase.from("questions").delete().eq("exam_id", examId);
      if (delErr) return toast.error(delErr.message);
    }
    const startPos = replace ? 0 : (data?.questions.length ?? 0);
    const rows = parsed.map((p, i) => ({
      exam_id: examId,
      question_text: p.question_text,
      options: p.options,
      correct_index: p.correct_index,
      position: startPos + i,
    }));
    const { error } = await supabase.from("questions").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Imported ${rows.length} question${rows.length === 1 ? "" : "s"}`);
    qc.invalidateQueries({ queryKey: ["admin-exam", examId] });
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-exam", examId] });
  }

  if (isLoading) return <div className="mx-auto max-w-4xl px-6 py-12"><div className="h-96 rounded bg-muted animate-pulse" /></div>;
  if (!data?.exam) return <div className="mx-auto max-w-4xl px-6 py-12">Not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to admin
      </Link>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Edit exam</div>
        <h1 className="font-display text-3xl mt-1">{meta.title}</h1>
      </div>

      {/* Meta editor */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6 space-y-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input className={inputCls} value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))} />
          </Field>
          <Field label="Subject">
            <input className={inputCls} value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))} />
          </Field>
          <Field label="Duration (min)">
            <input type="number" min={1} className={inputCls} value={meta.duration_minutes} onChange={e => setMeta(m => ({ ...m, duration_minutes: Number(e.target.value) }))} />
          </Field>
          <Field label="Description">
            <input className={inputCls} value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} />
          </Field>
        </div>
        <button onClick={saveMeta} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium">
          <Save className="h-4 w-4" /> Save details
        </button>
      </div>

      {/* Bulk import */}
      <BulkImport onImport={bulkImport} hasExisting={data.questions.length > 0} />

      {/* Questions */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl">Questions ({data.questions.length})</h2>
        <button onClick={addQuestion} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-accent-foreground font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Add question
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {data.questions.map((q, i) => (
          <QuestionCard key={q.id} q={q} index={i} onSave={updateQuestion} onDelete={() => deleteQuestion(q.id)} />
        ))}
        {data.questions.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-border p-10 text-center text-muted-foreground">
            No questions yet. Click "Add question".
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ q, index, onSave, onDelete }: {
  q: Question; index: number; onSave: (q: Question) => void; onDelete: () => void;
}) {
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question {index + 1}</span>
        <button onClick={onDelete} className="text-destructive hover:opacity-70"><Trash2 className="h-4 w-4" /></button>
      </div>
      <textarea
        rows={2}
        value={draft.question_text}
        onChange={e => setDraft(d => ({ ...d, question_text: e.target.value }))}
        className={inputCls + " resize-none"}
      />
      <div className="mt-3 space-y-2">
        {draft.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDraft(d => ({ ...d, correct_index: idx }))}
              title="Mark as correct"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${draft.correct_index === idx ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {String.fromCharCode(65 + idx)}
            </button>
            <input
              value={opt}
              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
              onChange={e => setDraft(d => {
                const options = [...d.options]; options[idx] = e.target.value;
                return { ...d, options };
              })}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Click a letter to mark the correct answer</span>
        <button onClick={() => onSave(draft)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>
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

// ====================== Bulk import ======================

type ParsedQ = { question_text: string; options: string[]; correct_index: number };

const SAMPLE_SCRIPT = `Q: What is the SI unit of force?
A) Joule
B) Newton *
C) Pascal
D) Watt

Q: Which organelle is the powerhouse of the cell?
A) Nucleus
B) Ribosome
C) Mitochondria *
D) Golgi apparatus`;

/**
 * Parses two formats:
 * 1) JSON array: [{ "q": "...", "options": ["A","B","C","D"], "answer": 1 }, ...]
 *    - "answer" can be index (0-3) OR letter ("A"-"D")
 * 2) Script format:
 *      Q: question text
 *      A) option one
 *      B) option two *      <-- the * marks the correct answer
 *      C) option three
 *      D) option four
 *    Blank line separates questions. Letters A-Z supported.
 */
function parseScript(input: string): { ok: true; questions: ParsedQ[] } | { ok: false; error: string } {
  const text = input.trim();
  if (!text) return { ok: false, error: "Paste some questions first." };

  // Try JSON
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      const raw = JSON.parse(text);
      const arr = Array.isArray(raw) ? raw : [raw];
      const questions: ParsedQ[] = arr.map((item: any, i: number) => {
        const q = String(item.q ?? item.question ?? item.question_text ?? "").trim();
        const options: string[] = (item.options ?? item.choices ?? []).map((o: any) => String(o));
        let ans = item.answer ?? item.correct ?? item.correct_index ?? 0;
        if (typeof ans === "string" && ans.length === 1) ans = ans.toUpperCase().charCodeAt(0) - 65;
        const correct_index = Number(ans);
        if (!q) throw new Error(`Question ${i + 1} missing text`);
        if (options.length < 2) throw new Error(`Question ${i + 1} needs at least 2 options`);
        if (!Number.isInteger(correct_index) || correct_index < 0 || correct_index >= options.length) {
          throw new Error(`Question ${i + 1} has invalid answer index`);
        }
        return { question_text: q, options, correct_index };
      });
      return { ok: true, questions };
    } catch (e: any) {
      return { ok: false, error: `JSON parse error: ${e.message}` };
    }
  }

  // Script format
  const blocks = text.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
  const questions: ParsedQ[] = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let qLine = lines[0];
    const qMatch = qLine.match(/^(?:Q[:.)]?\s*|\d+[.)]\s*)(.*)$/i);
    qLine = qMatch ? qMatch[1].trim() : qLine;
    const options: string[] = [];
    let correct_index = -1;
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^([A-Z])[).:\-]\s*(.+)$/i);
      if (!m) return { ok: false, error: `Question ${bi + 1}: cannot parse line "${lines[i]}"` };
      let optText = m[2].trim();
      if (/\s\*\s*$|\*$/.test(optText)) {
        correct_index = options.length;
        optText = optText.replace(/\s*\*\s*$/, "").trim();
      }
      options.push(optText);
    }
    if (!qLine) return { ok: false, error: `Question ${bi + 1}: missing question text` };
    if (options.length < 2) return { ok: false, error: `Question ${bi + 1}: needs at least 2 options` };
    if (correct_index < 0) return { ok: false, error: `Question ${bi + 1}: mark the correct answer with " *" at the end of an option` };
    questions.push({ question_text: qLine, options, correct_index });
  }
  if (!questions.length) return { ok: false, error: "No questions detected." };
  return { ok: true, questions };
}

function BulkImport({ onImport, hasExisting }: { onImport: (qs: ParsedQ[], replace: boolean) => void; hasExisting: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);

  const result = text.trim() ? parseScript(text) : null;
  const count = result?.ok ? result.questions.length : 0;
  const error = result && !result.ok ? result.error : null;

  return (
    <div className="mt-8 rounded-lg border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Code2 className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium flex items-center gap-2">
            Bulk import questions <Sparkles className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="text-xs text-muted-foreground">Paste a question paper script and we'll auto-create the questions.</div>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="border-t border-border p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Your script</div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={14}
                spellCheck={false}
                placeholder={SAMPLE_SCRIPT}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Format guide</div>
              <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed">{`Q: question text
A) option one
B) option two *      ← star marks correct
C) option three
D) option four

(blank line between questions)

Also supports JSON:
[{ "q":"2+2?", "options":["3","4","5"], "answer":"B" }]`}</pre>
              <button
                type="button"
                onClick={() => setText(SAMPLE_SCRIPT)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Load sample
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {error && <span className="text-sm text-destructive">{error}</span>}
            {!error && count > 0 && (
              <span className="text-sm text-success-foreground bg-success/15 px-2 py-0.5 rounded">
                {count} question{count === 1 ? "" : "s"} ready
              </span>
            )}
            {hasExisting && (
              <label className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />
                Replace existing questions
              </label>
            )}
            <button
              disabled={!result?.ok}
              onClick={() => {
                if (!result?.ok) return;
                if (replace && hasExisting && !confirm("Delete all existing questions and import these?")) return;
                onImport(result.questions, replace);
                setText("");
                setOpen(false);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Import {count > 0 ? `(${count})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
