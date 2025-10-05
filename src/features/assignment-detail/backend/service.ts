import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { AssignmentDetailResponse } from './schema';

type AssignmentDetailError = 'ASSIGNMENT_NOT_FOUND' | 'ACCESS_DENIED' | 'DETAIL_FETCH_FAILED';

export const getAssignmentDetail = async (
  client: SupabaseClient,
  assignmentId: string,
  userId: string,
): Promise<HandlerResult<AssignmentDetailResponse, AssignmentDetailError, unknown>> => {
  try {
    const { data: assignment, error: aErr } = await client
      .from('assignments')
      .select('id, title, description, due_date, weight, allow_late, allow_resubmission, status, course_id')
      .eq('id', assignmentId)
      .maybeSingle();
    if (aErr || !assignment) return failure(404, 'ASSIGNMENT_NOT_FOUND', aErr?.message ?? 'Assignment not found');

    // 수강 여부 확인
    const { data: enrollment } = await client
      .from('enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('learner_id', userId)
      .is('cancelled_at', null)
      .maybeSingle();
    if (!enrollment) return failure(403, 'ACCESS_DENIED', 'Not enrolled in this course');

    if (assignment.status !== 'published') {
      return failure(403, 'ACCESS_DENIED', 'Assignment not yet published');
    }

    const { data: submission } = await client
      .from('submissions')
      .select('id, status, is_late')
      .eq('assignment_id', assignmentId)
      .eq('learner_id', userId)
      .maybeSingle();

    const now = Date.now();
    const due = new Date(assignment.due_date).getTime();
    const overdue = now > due;
    const canSubmit = assignment.status !== 'closed' && (!overdue || Boolean(assignment.allow_late));

    return success({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        weight: assignment.weight,
        allowLate: assignment.allow_late,
        allowResubmission: assignment.allow_resubmission,
        status: assignment.status,
      },
      submission: submission
        ? { id: submission.id, status: submission.status, isLate: submission.is_late }
        : null,
      canSubmit,
      policies: { allowLate: assignment.allow_late, allowResubmission: assignment.allow_resubmission },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return failure(500, 'DETAIL_FETCH_FAILED', message);
  }
};


