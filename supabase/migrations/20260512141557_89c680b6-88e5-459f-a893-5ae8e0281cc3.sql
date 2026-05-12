-- =====================================================
-- EXAMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL DEFAULT 'General',
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- QUESTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  exam_id uuid NOT NULL
  REFERENCES public.exams(id)
  ON DELETE CASCADE,

  question_text text NOT NULL,

  options jsonb NOT NULL
  DEFAULT '["","","",""]'::jsonb,

  correct_index integer NOT NULL DEFAULT 0,

  position integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS questions_exam_id_idx
ON public.questions(exam_id);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.exams
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.questions
ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVE OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Public read exams"
ON public.exams;

DROP POLICY IF EXISTS "Public write exams"
ON public.exams;

DROP POLICY IF EXISTS "Public update exams"
ON public.exams;

DROP POLICY IF EXISTS "Public delete exams"
ON public.exams;

DROP POLICY IF EXISTS "Public read questions"
ON public.questions;

DROP POLICY IF EXISTS "Public write questions"
ON public.questions;

DROP POLICY IF EXISTS "Public update questions"
ON public.questions;

DROP POLICY IF EXISTS "Public delete questions"
ON public.questions;

-- =====================================================
-- READ ACCESS FOR LOGGED-IN USERS
-- =====================================================

CREATE POLICY "Authenticated users can read exams"
ON public.exams
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read questions"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- ADMIN-ONLY EXAM CREATION
-- =====================================================

CREATE POLICY "Admin can insert exams"
ON public.exams
FOR INSERT
TO authenticated
WITH CHECK (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

CREATE POLICY "Admin can update exams"
ON public.exams
FOR UPDATE
TO authenticated
USING (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
)
WITH CHECK (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

CREATE POLICY "Admin can delete exams"
ON public.exams
FOR DELETE
TO authenticated
USING (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

-- =====================================================
-- ADMIN-ONLY QUESTION MANAGEMENT
-- =====================================================

CREATE POLICY "Admin can insert questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

CREATE POLICY "Admin can update questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
)
WITH CHECK (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

CREATE POLICY "Admin can delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);
