import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { AssignmentCreate, AssignmentUpdate } from './types';

type AssignmentError =
  | 'ASSIGNMENT_CREATE_FAILED'
  | 'ASSIGNMENT_UPDATE_FAILED'
  | 'ASSIGNMENT_NOT_FOUND'
  | 'STATUS_UPDATE_FAILED';

export const createAssignment = async (
  client: SupabaseClient,
  instructorId: string,
  payload: AssignmentCreate,
): Promise<HandlerResult<{ id: string }, AssignmentError, unknown>> => {
  // 코스 소유권 확인
  const { data: course } = await client
    .from('courses')
    .select('id, instructor_id')
    .eq('id', payload.courseId)
    .maybeSingle();
  if (!course || course.instructor_id !== instructorId) {
    return failure(404, 'ASSIGNMENT_NOT_FOUND', 'Course not found or forbidden');
  }

  const { data, error } = await client
    .from('assignments')
    .insert({
      course_id: payload.courseId,
      title: payload.title,
      description: payload.description,
      due_date: payload.due_date,
      weight: payload.weight,
      allow_late: payload.allow_late,
      allow_resubmission: payload.allow_resubmission,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error || !data) return failure(500, 'ASSIGNMENT_CREATE_FAILED', error?.message ?? 'Failed to create assignment');
  return success({ id: data.id }, 201);
};

export const updateAssignment = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  payload: AssignmentUpdate,
): Promise<HandlerResult<{ id: string }, AssignmentError, unknown>> => {
  const { data: found } = await client
    .from('assignments')
    .select('id, course_id, courses(instructor_id)')
    .eq('id', assignmentId)
    .maybeSingle();
  const owner = (found as any)?.courses?.instructor_id;
  if (!found || owner !== instructorId) return failure(404, 'ASSIGNMENT_NOT_FOUND', 'Not found or forbidden');

  const update = {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.due_date !== undefined ? { due_date: payload.due_date } : {}),
    ...(payload.weight !== undefined ? { weight: payload.weight } : {}),
    ...(payload.allow_late !== undefined ? { allow_late: payload.allow_late } : {}),
    ...(payload.allow_resubmission !== undefined ? { allow_resubmission: payload.allow_resubmission } : {}),
  };

  const { data, error } = await client
    .from('assignments')
    .update(update)
    .eq('id', assignmentId)
    .select('id')
    .single();
  if (error || !data) return failure(500, 'ASSIGNMENT_UPDATE_FAILED', error?.message ?? 'Failed to update assignment');
  return success({ id: data.id });
};

export const updateAssignmentStatus = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  status: 'draft' | 'published' | 'closed',
): Promise<HandlerResult<{ id: string; status: string }, AssignmentError, unknown>> => {
  const { data: found } = await client
    .from('assignments')
    .select('id, status, course_id, courses(instructor_id)')
    .eq('id', assignmentId)
    .maybeSingle();
  const owner = (found as any)?.courses?.instructor_id;
  if (!found || owner !== instructorId) return failure(404, 'ASSIGNMENT_NOT_FOUND', 'Not found or forbidden');

  const allowed: Record<string, string[]> = {
    draft: ['published'],
    published: ['closed'],
    closed: ['published'],
  };
  if (!allowed[found.status]?.includes(status)) {
    return failure(400, 'STATUS_UPDATE_FAILED', `Cannot transition from ${found.status} to ${status}`);
  }

  const { data, error } = await client
    .from('assignments')
    .update({ status })
    .eq('id', assignmentId)
    .select('id, status')
    .single();
  if (error || !data) return failure(500, 'STATUS_UPDATE_FAILED', error?.message ?? 'Failed to update status');
  return success({ id: data.id, status: data.status });
};


