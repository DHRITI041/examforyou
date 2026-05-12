-- =========================================================
-- TESTKART COMPLETE ADMIN AUTH + EXAM SYSTEM FIX
-- =========================================================
-- This removes old role-based auth
-- and replaces it with email-based admin access
--
-- ADMIN EMAIL:
-- dhriti.haringhata@gmail.com
-- =========================================================

-- =========================================================
-- REMOVE OLD POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Admins can insert exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can update exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can delete exams" ON public.exams;

DROP POLICY IF EXISTS "Admins can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can update questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;

DROP POLICY IF EXISTS "Public write exams" ON public.exams;
DROP POLICY IF EXISTS "Public update exams" ON public.exams;
DROP POLICY IF EXISTS "Public delete exams" ON public.exams;

DROP POLICY IF EXISTS "Public write questions" ON public.questions;
DROP POLICY IF EXISTS "Public update questions" ON public.questions;
DROP POLICY IF EXISTS "Public delete questions" ON public.questions;

-- =========================================================
-- KEEP PUBLIC READ ACCESS
-- =========================================================

DROP POLICY IF EXISTS "Authenticated can read exams" ON public.exams;

CREATE POLICY "Authenticated can read exams"
ON public.exams
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can read questions" ON public.questions;

CREATE POLICY "Authenticated can read questions"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

-- =========================================================
-- EMAIL-BASED ADMIN POLICIES FOR EXAMS
-- =========================================================

CREATE POLICY "Admin insert exams"
ON public.exams
FOR INSERT
TO authenticated
WITH CHECK (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

CREATE POLICY "Admin update exams"
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

CREATE POLICY "Admin delete exams"
ON public.exams
FOR DELETE
TO authenticated
USING (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

-- =========================================================
-- EMAIL-BASED ADMIN POLICIES FOR QUESTIONS
-- =========================================================

CREATE POLICY "Admin insert questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

CREATE POLICY "Admin update questions"
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

CREATE POLICY "Admin delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (
  lower(auth.jwt() ->> 'email')
  =
  'dhriti.haringhata@gmail.com'
);

-- =========================================================
-- REMOVE OLD ROLE SYSTEM (OPTIONAL CLEANUP)
-- =========================================================

DROP POLICY IF EXISTS "Users can read own roles"
ON public.user_roles;

DROP POLICY IF EXISTS "Admins can read all roles"
ON public.user_roles;

DROP POLICY IF EXISTS "Admins can manage roles"
ON public.user_roles;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

DROP TABLE IF EXISTS public.user_roles;

DROP TYPE IF EXISTS public.app_role;

-- =========================================================
-- DONE
-- =========================================================
