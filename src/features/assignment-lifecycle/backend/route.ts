import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { PublishParamsSchema, CloseParamsSchema, ExtendDeadlineSchema } from './schema';
import { publishAssignment, closeAssignment, extendAssignmentDeadline, autoCloseDueAssignments } from './service';

export const registerAssignmentLifecycleRoutes = (app: Hono<AppEnv>) => {
  app.get('/assignments/lifecycle/health', (c) => respond(c, success({ status: 'ok', feature: 'assignment-lifecycle' })));
  app.patch('/assignments/:id/publish', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const parsed = PublishParamsSchema.safeParse({ id: c.req.param('id') });
    if (!parsed.success) return respond(c, failure(400, 'INVALID_ID', 'Invalid assignment id', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await publishAssignment(supabase, parsed.data.id, instructorId);
    return respond(c, result);
  });
  app.patch('/assignments/:id/close', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const parsed = CloseParamsSchema.safeParse({ id: c.req.param('id') });
    if (!parsed.success) return respond(c, failure(400, 'INVALID_ID', 'Invalid assignment id', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await closeAssignment(supabase, parsed.data.id, instructorId);
    return respond(c, result);
  });
  app.patch('/assignments/:id/extend-deadline', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsedBody = ExtendDeadlineSchema.safeParse(body);
    if (!parsedBody.success) return respond(c, failure(400, 'INVALID_DEADLINE', 'Invalid payload', parsedBody.error.format()));
    const supabase = getSupabase(c);
    const result = await extendAssignmentDeadline(supabase, id, instructorId, parsedBody.data.newDueDate);
    return respond(c, result);
  });

  // 간단한 관리용 자동 마감 트리거 (운영자/스케줄러 대용)
  app.post('/assignments/auto-close', async (c) => {
    const supabase = getSupabase(c);
    const result = await autoCloseDueAssignments(supabase);
    return respond(c, result);
  });
};


