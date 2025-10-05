import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { getAdminDashboard } from './service';

export const registerAdminDashboardRoutes = (app: Hono<AppEnv>) => {
  app.get('/admin/health', (c) => respond(c, success({ status: 'ok', feature: 'admin-dashboard' })));
  app.get('/admin/dashboard', async (c) => {
    const operatorId = c.req.header('x-user-id') ?? '';
    if (!operatorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const supabase = getSupabase(c);
    const result = await getAdminDashboard(supabase, operatorId);
    return respond(c, result);
  });
};


