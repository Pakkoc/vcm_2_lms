import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond, success } from '@/backend/http/response';

export const registerGradingHistoryRoutes = (app: Hono<AppEnv>) => {
  app.get('/grading/history/health', (c) => respond(c, success({ status: 'ok', feature: 'grading-history' })));
};


