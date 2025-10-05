import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { EnrollRequest } from './schema';

type EnrollmentError =
  | 'COURSE_NOT_FOUND'
  | 'COURSE_NOT_PUBLISHED'
  | 'ALREADY_ENROLLED'
  | 'CAPACITY_REACHED'
  | 'ENROLLMENT_FAILED'
  | 'CANCEL_FAILED';

export const enroll = async (
  client: SupabaseClient,
  learnerId: string,
  payload: EnrollRequest,
): Promise<HandlerResult<{ enrollmentId: string }, EnrollmentError, unknown>> => {
  // 코스 확인
  const { data: course, error: courseError } = await client
    .from('courses')
    .select('id, status, max_students, enrolled_count')
    .eq('id', payload.courseId)
    .maybeSingle();
  if (courseError || !course) {
    return failure(404, 'COURSE_NOT_FOUND', courseError?.message ?? 'Course not found');
  }
  if (course.status !== 'published') {
    return failure(400, 'COURSE_NOT_PUBLISHED', 'Course is not published');
  }

  // 중복 확인
  const { data: existing } = await client
    .from('enrollments')
    .select('id')
    .eq('course_id', payload.courseId)
    .eq('learner_id', learnerId)
    .is('cancelled_at', null)
    .maybeSingle();
  if (existing) {
    return failure(409, 'ALREADY_ENROLLED', 'Already enrolled');
  }

  // 정원 검사 (서비스에서 증감)
  if (typeof course.max_students === 'number' && course.max_students > 0) {
    const current = Number(course.enrolled_count ?? 0);
    if (current >= course.max_students) {
      return failure(400, 'CAPACITY_REACHED', 'Course capacity reached');
    }
  }

  // 수강 생성
  const { data: created, error: createError } = await client
    .from('enrollments')
    .insert({ course_id: payload.courseId, learner_id: learnerId })
    .select('id')
    .single();
  if (createError || !created) {
    return failure(500, 'ENROLLMENT_FAILED', createError?.message ?? 'Failed to enroll');
  }

  // 카운트 증가 (best-effort)
  await client
    .from('courses')
    .update({ enrolled_count: (course.enrolled_count ?? 0) + 1 })
    .eq('id', payload.courseId);

  return success({ enrollmentId: created.id }, 201);
};

export const cancelEnrollment = async (
  client: SupabaseClient,
  enrollmentId: string,
): Promise<HandlerResult<{ cancelledAt: string }, EnrollmentError, unknown>> => {
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from('enrollments')
    .update({ cancelled_at: nowIso })
    .eq('id', enrollmentId)
    .select('id')
    .maybeSingle();
  if (error || !data) {
    return failure(500, 'CANCEL_FAILED', error?.message ?? 'Failed to cancel');
  }
  return success({ cancelledAt: nowIso });
};


