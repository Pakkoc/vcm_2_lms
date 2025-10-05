import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { getInstructorDashboard } from './service';

export const registerInstructorDashboardRoutes = (app: Hono<AppEnv>) => {
  app.get('/dashboard/instructor/health', (c) => respond(c, success({ status: 'ok', feature: 'instructor-dashboard' })));
  app.get('/dashboard/instructor', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const supabase = getSupabase(c);
    const result = await getInstructorDashboard(supabase, instructorId);
    return respond(c, result);
  });
};


