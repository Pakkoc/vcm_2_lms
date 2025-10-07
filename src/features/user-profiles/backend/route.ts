import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { getProfileByUserId, updateProfile } from './service';
import { UpdateProfileSchema } from './schema';

const sanitizeUserId = (value: string | null | undefined) => {
  if (!value) return '';
  if (value === 'undefined' || value === 'null') return '';
  return value;
};

export const registerUserProfileRoutes = (app: Hono<AppEnv>) => {
  app.get('/me/profile', async (c) => {
    const userId = sanitizeUserId(c.req.header('x-user-id'));
    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    }
    const supabase = getSupabase(c);
    const result = await getProfileByUserId(supabase, userId);
    return respond(c, result);
  });

  app.put('/me/profile', async (c) => {
    const userId = sanitizeUserId(c.req.header('x-user-id'));
    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    }
    const supabase = getSupabase(c);
    const body = await c.req.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, failure(400, 'INVALID_PROFILE', 'Invalid profile payload', parsed.error.format()));
    }

    const result = await updateProfile(supabase, {
      userId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      avatarUrl: parsed.data.avatarUrl ?? null,
    });
    return respond(c, result);
  });
};
