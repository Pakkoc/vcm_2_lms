import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond, success } from '@/backend/http/response';

export const registerSubmissionHistoryRoutes = (app: Hono<AppEnv>) => {
  app.get('/submissions/history/health', (c) => respond(c, success({ status: 'ok', feature: 'submission-history' })));
};


