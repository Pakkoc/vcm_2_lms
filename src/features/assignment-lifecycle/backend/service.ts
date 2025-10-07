import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';

type LifecycleError = 'ASSIGNMENT_NOT_FOUND' | 'FORBIDDEN' | 'LIFECYCLE_FAILED' | 'INVALID_STATE';

export const publishAssignment = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
): Promise<HandlerResult<{ id: string; status: string }, LifecycleError, unknown>> => {
  const { data: found } = await client
    .from('assignments')
    .select('id, status, course_id, courses(instructor_id)')
    .eq('id', assignmentId)
    .maybeSingle();
  const owner = (found as any)?.courses?.instructor_id;
  if (!found) return failure(404, 'ASSIGNMENT_NOT_FOUND', 'Not found');
  if (owner !== instructorId) return failure(403, 'FORBIDDEN', 'Not allowed');
  if (found.status !== 'draft') return failure(400, 'INVALID_STATE', 'Only draft can be published');

  const { data, error } = await client
    .from('assignments')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select('id, status')
    .single();
  if (error || !data) return failure(500, 'LIFECYCLE_FAILED', error?.message ?? 'Failed to publish');
  return success({ id: data.id, status: data.status });
};

export const closeAssignment = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
): Promise<HandlerResult<{ id: string; status: string }, LifecycleError, unknown>> => {
  const { data: found } = await client
    .from('assignments')
    .select('id, status, course_id, courses(instructor_id)')
    .eq('id', assignmentId)
    .maybeSingle();
  const owner = (found as any)?.courses?.instructor_id;
  if (!found) return failure(404, 'ASSIGNMENT_NOT_FOUND', 'Not found');
  if (owner !== instructorId) return failure(403, 'FORBIDDEN', 'Not allowed');
  if (found.status !== 'published') return failure(400, 'INVALID_STATE', 'Only published can be closed');

  const { data, error } = await client
    .from('assignments')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select('id, status')
    .single();
  if (error || !data) return failure(500, 'LIFECYCLE_FAILED', error?.message ?? 'Failed to close');
  return success({ id: data.id, status: data.status });
};

export const extendAssignmentDeadline = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  newDueDateIso: string,
): Promise<HandlerResult<{ id: string; status: string; due_date: string }, LifecycleError, unknown>> => {
  const { data: found } = await client
    .from('assignments')
    .select('id, status, course_id, courses(instructor_id)')
    .eq('id', assignmentId)
    .maybeSingle();
  const owner = (found as any)?.courses?.instructor_id;
  if (!found) return failure(404, 'ASSIGNMENT_NOT_FOUND', 'Not found');
  if (owner !== instructorId) return failure(403, 'FORBIDDEN', 'Not allowed');

  const updates: Record<string, unknown> = { due_date: newDueDateIso };
  if (found.status === 'closed') {
    updates.status = 'published';
  }

  const { data, error } = await client
    .from('assignments')
    .update(updates)
    .eq('id', assignmentId)
    .select('id, status, due_date')
    .single();
  if (error || !data) return failure(500, 'LIFECYCLE_FAILED', error?.message ?? 'Failed to extend deadline');
  return success({ id: data.id, status: data.status, due_date: data.due_date });
};


export const autoCloseDueAssignments = async (
  client: SupabaseClient,
): Promise<HandlerResult<{ closed: number }, LifecycleError, unknown>> => {
  // due_date 가 지났고 아직 published 상태인 과제 자동 마감
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from('assignments')
    .update({ status: 'closed', closed_at: nowIso })
    .lte('due_date', nowIso)
    .eq('status', 'published')
    .select('id');
  if (error) return failure(500, 'LIFECYCLE_FAILED', error.message);
  return success({ closed: (data ?? []).length });
};


