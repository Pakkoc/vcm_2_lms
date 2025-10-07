-- 0006_fix_courses_profiles_fk.sql
-- Fix relationship for Supabase join: courses ↔ profiles via instructor_id

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_instructor_id_fkey
  FOREIGN KEY (instructor_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;


