-- 0005_add_grading_history.sql
-- Add grading_history table to record grading events for submissions

CREATE TABLE IF NOT EXISTS public.grading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'grade' | 'regrade' | 'resubmission_required'
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grading_history_submission_idx ON public.grading_history(submission_id);
CREATE INDEX IF NOT EXISTS grading_history_instructor_idx ON public.grading_history(instructor_id);
CREATE INDEX IF NOT EXISTS grading_history_created_at_idx ON public.grading_history(created_at);


