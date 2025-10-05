import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { SubmissionRequest } from './schema';

type SubmissionError =
  | 'ASSIGNMENT_NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'SUBMISSION_NOT_ALLOWED'
  | 'SUBMISSION_FAILED';

export const submitAssignment = async (
  client: SupabaseClient,
  learnerId: string,
  payload: SubmissionRequest,
): Promise<HandlerResult<{ submissionId: string; isLate: boolean }, SubmissionError, unknown>> => {
  // 과제/권한 확인
  const { data: assignment, error: aErr } = await client
    .from('assignments')
    .select('id, course_id, due_date, status, allow_late, allow_resubmission')
    .eq('id', payload.assignmentId)
    .maybeSingle();
  if (aErr || !assignment) return failure(404, 'ASSIGNMENT_NOT_FOUND', aErr?.message ?? 'Assignment not found');

  const { data: enrollment } = await client
    .from('enrollments')
    .select('id')
    .eq('course_id', assignment.course_id)
    .eq('learner_id', learnerId)
    .is('cancelled_at', null)
    .maybeSingle();
  if (!enrollment) return failure(403, 'ACCESS_DENIED', 'Not enrolled');

  if (assignment.status === 'closed') {
    return failure(400, 'SUBMISSION_NOT_ALLOWED', 'Assignment closed');
  }

  const now = Date.now();
  const due = new Date(assignment.due_date).getTime();
  const isLate = now > due;
  if (isLate && !assignment.allow_late) {
    return failure(400, 'SUBMISSION_NOT_ALLOWED', 'Deadline passed');
  }

  // 기존 제출 확인
  const { data: existing } = await client
    .from('submissions')
    .select('id, status')
    .eq('assignment_id', payload.assignmentId)
    .eq('learner_id', learnerId)
    .maybeSingle();

  if (existing && existing.status !== 'resubmission_required' && !assignment.allow_resubmission) {
    return failure(400, 'SUBMISSION_NOT_ALLOWED', 'Resubmission not allowed');
  }

  const base = {
    assignment_id: payload.assignmentId,
    learner_id: learnerId,
    content: payload.content,
    link_url: payload.linkUrl || null,
    is_late: isLate,
    status: 'submitted' as const,
  };

  const upsert = existing
    ? client.from('submissions').update(base).eq('id', existing.id).select('id').single()
    : client.from('submissions').insert(base).select('id').single();

  const { data: saved, error: saveErr } = await upsert;
  if (saveErr || !saved) return failure(500, 'SUBMISSION_FAILED', saveErr?.message ?? 'Failed to submit');

  return success({ submissionId: saved.id, isLate }, existing ? 200 : 201);
};


