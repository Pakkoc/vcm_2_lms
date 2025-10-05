import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { AssignmentDetailParamsSchema } from './schema';
import { getAssignmentDetail } from './service';

export const registerAssignmentDetailRoutes = (app: Hono<AppEnv>) => {
  app.get('/assignments/health', (c) => respond(c, success({ status: 'ok', feature: 'assignment-detail' })));
  app.get('/assignments/:assignmentId', async (c) => {
    const parsed = AssignmentDetailParamsSchema.safeParse({ assignmentId: c.req.param('assignmentId') });
    if (!parsed.success) {
      return respond(c, failure(400, 'INVALID_ASSIGNMENT_ID', 'Invalid assignment id', parsed.error.format()));
    }
    const userId = c.req.header('x-user-id') ?? '';
    if (!userId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const supabase = getSupabase(c);
    const result = await getAssignmentDetail(supabase, parsed.data.assignmentId, userId);
    return respond(c, result);
  });
};


