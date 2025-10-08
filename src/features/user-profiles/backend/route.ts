import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { createProfile, getProfileByUserId, updateProfile } from './service';
import { isSupportedRole, type UserRole } from '@/constants/roles';
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

    // Try update first; if profile doesn't exist, create one using role from user metadata header
    const updateResult = await updateProfile(supabase, {
      userId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      avatarUrl: parsed.data.avatarUrl ?? null,
      bio: (parsed.data as any).bio ?? null,
      websiteUrl: (parsed.data as any).websiteUrl ?? null,
      contactHours: (parsed.data as any).contactHours ?? null,
      yearsOfExperience: (parsed.data as any).yearsOfExperience ?? null,
      expertise: (parsed.data as any).expertise ?? null,
      school: (parsed.data as any).school ?? null,
      grade: (parsed.data as any).grade ?? null,
      major: (parsed.data as any).major ?? null,
      interests: (parsed.data as any).interests ?? null,
    });

    if (updateResult.ok) {
      return respond(c, updateResult);
    } else {
      if ((updateResult as any).error.code !== 'PROFILE_NOT_FOUND') {
        return respond(c, updateResult);
      }
    }

    const roleHeader = c.req.header('x-user-role');
    const role: UserRole = isSupportedRole(roleHeader) ? roleHeader : 'learner';

    const createResult = await createProfile(supabase, {
      userId,
      role,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
    });

    // After creating, persist extended fields if any
    if (createResult.ok) {
      const followUp = await updateProfile(supabase, {
        userId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        avatarUrl: parsed.data.avatarUrl ?? null,
        bio: (parsed.data as any).bio ?? null,
        websiteUrl: (parsed.data as any).websiteUrl ?? null,
        contactHours: (parsed.data as any).contactHours ?? null,
        yearsOfExperience: (parsed.data as any).yearsOfExperience ?? null,
        expertise: (parsed.data as any).expertise ?? null,
        school: (parsed.data as any).school ?? null,
        grade: (parsed.data as any).grade ?? null,
        major: (parsed.data as any).major ?? null,
        interests: (parsed.data as any).interests ?? null,
      });
      return respond(c, followUp.ok ? followUp : createResult);
    }

    return respond(c, createResult);
  });
};
