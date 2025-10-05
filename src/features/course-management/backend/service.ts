import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { CourseCreate, CourseUpdate } from './schema';

type CourseError =
  | 'COURSE_CREATE_FAILED'
  | 'COURSE_UPDATE_FAILED'
  | 'COURSE_NOT_FOUND'
  | 'STATUS_UPDATE_FAILED';

export const createCourse = async (
  client: SupabaseClient,
  instructorId: string,
  payload: CourseCreate,
): Promise<HandlerResult<{ id: string }, CourseError, unknown>> => {
  const { data, error } = await client
    .from('courses')
    .insert({ ...payload, instructor_id: instructorId, status: 'draft' })
    .select('id')
    .single();
  if (error || !data) return failure(500, 'COURSE_CREATE_FAILED', error?.message ?? 'Failed to create course');
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


