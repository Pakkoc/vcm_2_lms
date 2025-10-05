import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { SubmissionRequestSchema } from './schema';
import { submitAssignment } from './service';

export const registerAssignmentSubmissionRoutes = (app: Hono<AppEnv>) => {
  app.get('/submissions/health', (c) => respond(c, success({ status: 'ok', feature: 'assignment-submission' })));
  app.post('/submissions', async (c) => {
    const body = await c.req.json();
    const parsed = SubmissionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, failure(400, 'INVALID_SUBMISSION', 'Invalid submission payload', parsed.error.format()));
    }
    const learnerId = c.req.header('x-user-id') ?? '';
    if (!learnerId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const supabase = getSupabase(c);
    const result = await submitAssignment(supabase, learnerId, parsed.data);
    return respond(c, result);
  });
};


