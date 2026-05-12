-- =====================================================
-- FIX HAS_ROLE ERROR + ADMIN SYSTEM
-- CREATE THIS AS A NEW MIGRATION FILE
-- =====================================================

-- =====================================================
-- REMOVE OLD ROLE SYSTEM
-- =====================================================

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

DROP TABLE IF EXISTS public.user_roles CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;

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

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.exams
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.questions
ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- READ ACCESS
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
-- ADMIN EXAM ACCESS
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
-- ADMIN QUESTION ACCESS
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

-- =====================================================
-- DONE
-- =====================================================
