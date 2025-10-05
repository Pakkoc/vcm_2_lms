import type { Hono } from 'hono';
import { z } from 'zod';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { SignupRequestSchema } from './schema';
import { signup } from './service';

export const registerAuthOnboardingRoutes = (app: Hono<AppEnv>) => {
  app.get('/auth/health', (c) => respond(c, success({ status: 'ok', feature: 'auth-onboarding' })));

  app.post('/auth/signup', async (c) => {
    const body = await c.req.json();
    const parsed = SignupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, failure(400, 'INVALID_SIGNUP_PAYLOAD', 'Invalid signup payload.', parsed.error.format()));
    }

    const supabase = getSupabase(c);
    const result = await signup(supabase, parsed.data);
    return respond(c, result);
  });
};


