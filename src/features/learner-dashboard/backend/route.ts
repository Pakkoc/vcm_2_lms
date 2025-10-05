import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { getLearnerDashboard } from './service';

export const registerLearnerDashboardRoutes = (app: Hono<AppEnv>) => {
  app.get('/dashboard/learner/health', (c) => respond(c, success({ status: 'ok', feature: 'learner-dashboard' })));
  app.get('/dashboard/learner', async (c) => {
    const userId = c.req.header('x-user-id') ?? '';
    if (!userId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const supabase = getSupabase(c);
    const result = await getLearnerDashboard(supabase, userId);
    return respond(c, result);
  });
};


