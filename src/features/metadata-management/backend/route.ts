import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond, success } from '@/backend/http/response';

export const registerMetadataManagementRoutes = (app: Hono<AppEnv>) => {
  app.get('/admin/metadata/health', (c) => respond(c, success({ status: 'ok', feature: 'metadata-management' })));
};


