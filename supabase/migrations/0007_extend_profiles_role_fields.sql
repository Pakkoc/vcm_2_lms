-- 0007_extend_profiles_role_fields.sql
-- Extend profiles with role-specific fields for learners and instructors

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_hours TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience SMALLINT,
  ADD COLUMN IF NOT EXISTS expertise TEXT[],
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[];


