import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond, success } from '@/backend/http/response';

export const registerReportManagementRoutes = (app: Hono<AppEnv>) => {
  app.get('/admin/reports/health', (c) => respond(c, success({ status: 'ok', feature: 'report-management' })));
};


