import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { CourseCreate, CourseUpdate } from './schema';

type CourseError =
  | 'COURSE_CREATE_FAILED'
  | 'COURSE_UPDATE_FAILED'
  | 'COURSE_NOT_FOUND'
  | 'STATUS_UPDATE_FAILED'
  | 'INSTRUCTOR_NOT_FOUND';

const ensureInstructorProfile = async (
  client: SupabaseClient,
  instructorId: string,
): Promise<HandlerResult<{ id: string }, CourseError, unknown>> => {
  const { data, error } = await client
    .from('profiles')
    .select('id, role')
    .eq('id', instructorId)
    .maybeSingle();
  if (error || !data || data.role !== 'instructor') {
    return failure(400, 'INSTRUCTOR_NOT_FOUND', 'Instructor profile not found', {
      instructorId,
      role: data?.role ?? null,
    });
  }
  return success({ id: data.id });
};

export const createCourse = async (
  client: SupabaseClient,
  instructorId: string,
  payload: CourseCreate,
): Promise<HandlerResult<{ id: string }, CourseError, unknown>> => {
  const instructorCheck = await ensureInstructorProfile(client, instructorId);
  if (!instructorCheck.ok) {
    return instructorCheck;
  }

  const { data, error } = await client
    .from('courses')
    .insert({ ...payload, instructor_id: instructorId, status: 'draft' })
    .select('id')
    .single();
  if (error || !data) {
    const code = (error as PostgrestError | null)?.code ?? null;
    if (code === '23503') {
      return failure(400, 'INSTRUCTOR_NOT_FOUND', 'Instructor account is not registered', { instructorId });
    }
    return failure(500, 'COURSE_CREATE_FAILED', error?.message ?? 'Failed to create course', { instructorId });
  }
  return success({ id: data.id }, 201);
};

export const updateCourse = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  payload: CourseUpdate,
): Promise<HandlerResult<{ id: string }, CourseError, unknown>> => {
  const { data: found } = await client
    .from('courses')
    .select('id, instructor_id')
    .eq('id', courseId)
    .maybeSingle();
  if (!found || found.instructor_id !== instructorId) return failure(404, 'COURSE_NOT_FOUND', 'Not found or forbidden');

  const { data, error } = await client
    .from('courses')
    .update(payload)
    .eq('id', courseId)
    .select('id')
    .single();
  if (error || !data) return failure(500, 'COURSE_UPDATE_FAILED', error?.message ?? 'Failed to update course');
  return success({ id: data.id });
};

export const updateCourseStatus = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  status: 'draft' | 'published' | 'archived',
): Promise<HandlerResult<{ id: string; status: string }, CourseError, unknown>> => {
  const { data: found } = await client
    .from('courses')
    .select('id, instructor_id, status')
    .eq('id', courseId)
    .maybeSingle();
  if (!found || found.instructor_id !== instructorId) return failure(404, 'COURSE_NOT_FOUND', 'Not found or forbidden');

  // 간단한 전환 규칙: draft->published, published->archived, archived->published
  const allowed: Record<string, string[]> = {
    draft: ['published'],
    published: ['archived'],
    archived: ['published'],
  };
  if (!allowed[found.status]?.includes(status)) {
    return failure(400, 'STATUS_UPDATE_FAILED', `Cannot transition from ${found.status} to ${status}`);
  }

  const { data, error } = await client
    .from('courses')
    .update({ status })
    .eq('id', courseId)
    .select('id, status')
    .single();
  if (error || !data) return failure(500, 'STATUS_UPDATE_FAILED', error?.message ?? 'Failed to update status');
  return success({ id: data.id, status: data.status });
};

