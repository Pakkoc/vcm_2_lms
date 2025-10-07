-- 0004_add_assignment_timestamps.sql
-- Add published_at and closed_at to assignments to support lifecycle operations

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Optional indexes to query by publication/closure time
CREATE INDEX IF NOT EXISTS assignments_published_at_idx ON public.assignments(published_at);
CREATE INDEX IF NOT EXISTS assignments_closed_at_idx ON public.assignments(closed_at);


