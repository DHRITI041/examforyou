
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null default 'General',
  description text,
  duration_minutes integer not null default 60,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  options jsonb not null default '["","","",""]'::jsonb,
  correct_index integer not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index questions_exam_id_idx on public.questions(exam_id);

alter table public.exams enable row level security;
alter table public.questions enable row level security;

create policy "Public read exams" on public.exams for select using (true);
create policy "Public write exams" on public.exams for insert with check (true);
create policy "Public update exams" on public.exams for update using (true) with check (true);
create policy "Public delete exams" on public.exams for delete using (true);

create policy "Public read questions" on public.questions for select using (true);
create policy "Public write questions" on public.questions for insert with check (true);
create policy "Public update questions" on public.questions for update using (true) with check (true);
create policy "Public delete questions" on public.questions for delete using (true);
