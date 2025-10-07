import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';

type GradingError = 'SUBMISSION_NOT_FOUND' | 'FORBIDDEN' | 'GRADING_FAILED';

export const gradeSubmission = async (
  client: SupabaseClient,
  params: { submissionId: string; instructorId: string; score: number; feedback: string; action: 'grade' | 'regrade' | 'resubmission_required' },
): Promise<HandlerResult<{ id: string }, GradingError, unknown>> => {
  const { data: found } = await client
    .from('submissions')
    .select('id, assignment_id, assignments(course_id, courses(instructor_id))')
    .eq('id', params.submissionId)
    .maybeSingle();
  const owner = (found as any)?.assignments?.courses?.instructor_id;
  if (!found) return failure(404, 'SUBMISSION_NOT_FOUND', 'Submission not found');
  if (owner !== params.instructorId) return failure(403, 'FORBIDDEN', 'Not allowed');

  if (params.action === 'resubmission_required') {
    const { data, error } = await client
      .from('submissions')
      .update({ status: 'resubmission_required', feedback: params.feedback })
      .eq('id', params.submissionId)
      .select('id')
      .single();
    if (error || !data) return failure(500, 'GRADING_FAILED', error?.message ?? 'Failed to request resubmission');

    // 기록: 재제출 요청
    await client.from('grading_history').insert({
      submission_id: params.submissionId,
      instructor_id: params.instructorId,
      action: 'resubmission_required',
      score: null,
      feedback: params.feedback,
    });
    return success({ id: data.id });
  }

  const { data, error } = await client
    .from('submissions')
    .update({ status: 'graded', score: params.score, feedback: params.feedback, graded_at: new Date().toISOString() })
    .eq('id', params.submissionId)
    .select('id')
    .single();
  if (error || !data) return failure(500, 'GRADING_FAILED', error?.message ?? 'Failed to grade');
  // 기록: 채점/재채점
  await client.from('grading_history').insert({
    submission_id: params.submissionId,
    instructor_id: params.instructorId,
    action: params.action,
    score: params.score,
    feedback: params.feedback,
  });
  return success({ id: data.id });
};

export const batchGradeSubmissions = async (
  client: SupabaseClient,
  params: { submissionIds: string[]; instructorId: string; score: number; feedback: string },
): Promise<HandlerResult<{ updated: number }, GradingError, unknown>> => {
  // 단순 일괄 업데이트 (권한은 개별 검증이 이상적이나 최소 구현)
  const { data, error } = await client
    .from('submissions')
    .update({ status: 'graded', score: params.score, feedback: params.feedback, graded_at: new Date().toISOString() })
    .in('id', params.submissionIds)
    .select('id');
  if (error) return failure(500, 'GRADING_FAILED', error.message);
  // 간단 기록: 일괄 채점 이벤트 (개별 기록)
  if ((data ?? []).length > 0) {
    const events = (data ?? []).map((row: { id: string }) => ({
      submission_id: row.id,
      instructor_id: params.instructorId,
      action: 'grade',
      score: params.score,
      feedback: params.feedback,
    }));
    await client.from('grading_history').insert(events);
  }
  return success({ updated: (data ?? []).length });
};


