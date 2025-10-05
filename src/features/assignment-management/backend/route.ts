import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { AssignmentCreateSchema, AssignmentUpdateSchema, AssignmentStatusSchema } from './schema';
import { createAssignment, updateAssignment, updateAssignmentStatus } from './service';

export const registerAssignmentManagementRoutes = (app: Hono<AppEnv>) => {
  app.get('/assignments/manage/health', (c) => respond(c, success({ status: 'ok', feature: 'assignment-management' })));
  app.post('/assignments', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const body = await c.req.json();
    const parsed = AssignmentCreateSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_ASSIGNMENT', 'Invalid payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await createAssignment(supabase, instructorId, parsed.data);
    return respond(c, result);
  });

  app.put('/assignments/:id', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const assignmentId = c.req.param('id');
    const body = await c.req.json();
    const parsed = AssignmentUpdateSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_ASSIGNMENT', 'Invalid payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await updateAssignment(supabase, assignmentId, instructorId, parsed.data);
    return respond(c, result);
  });

  app.patch('/assignments/:id/status', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const assignmentId = c.req.param('id');
    const body = await c.req.json();
    const parsed = AssignmentStatusSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_STATUS', 'Invalid payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await updateAssignmentStatus(supabase, assignmentId, instructorId, parsed.data.status);
    return respond(c, result);
  });
};


