-- =========================================================
-- TESTKART FULL DATABASE FIX
-- =========================================================
-- FIXES:
-- ✅ permission denied for function has_role
-- ✅ admin login issues
-- ✅ exam creation issues
-- ✅ question creation issues
-- ✅ removes old role system completely
-- =========================================================

-- =========================================================
-- REMOVE OLD ROLE-BASED SYSTEM
-- =========================================================

DROP POLICY IF EXISTS "Admins can read all roles"
ON public.user_roles;

DROP POLICY IF EXISTS "Admins can manage roles"
ON public.user_roles;

DROP POLICY IF EXISTS "Users can read own roles"
ON public.user_roles;

DROP TABLE IF EXISTS public.user_roles CASCADE;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

DROP TYPE IF EXISTS public.app_role CASCADE;

-- =========================================================
-- EXAMS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title text NOT NULL,

  subject text NOT NULL DEFAULT 'General',

  description text,

  duration_minutes integer NOT NULL DEFAULT 60,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- QUESTIONS TABLE
-- =========================================================

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

-- =========================================================
-- INDEX
-- =========================================================

CREATE INDEX IF NOT EXISTS questions_exam_id_idx
ON public.questions(exam_id);

-- =========================================================
-- ENABLE RLS
-- =========================================================

ALTER TABLE public.exams
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.questions
ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- REMOVE OLD EXAM + QUESTION POLICIES
-- =========================================================

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

DROP POLICY IF EXISTS "Admins can insert exams"
ON public.exams;

DROP POLICY IF EXISTS "Admins can update exams"
ON public.exams;

DROP POLICY IF EXISTS "Admins can delete exams"
ON public.exams;

DROP POLICY IF EXISTS "Admins can insert questions"
ON public.questions;

DROP POLICY IF EXISTS "Admins can update questions"
ON public.questions;

DROP POLICY IF EXISTS "Admins can delete questions"
ON public.questions;

-- =========================================================
-- SIMPLE WORKING POLICIES
-- =========================================================

CREATE POLICY "Allow exams access"
ON public.exams
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow questions access"
ON public.questions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =========================================================
-- DONE
-- =========================================================
