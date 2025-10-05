import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { getLearnerGrades } from './service';

export const registerLearnerGradesRoutes = (app: Hono<AppEnv>) => {
  app.get('/grades/learner/health', (c) => respond(c, success({ status: 'ok', feature: 'learner-grades' })));
  app.get('/grades/learner', async (c) => {
    const userId = c.req.header('x-user-id') ?? '';
    if (!userId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const supabase = getSupabase(c);
    const result = await getLearnerGrades(supabase, userId);
    return respond(c, result);
  });
};


