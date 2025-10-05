import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { CourseFiltersSchema } from './schema';
import { getCourses } from './service';

export const registerCourseCatalogRoutes = (app: Hono<AppEnv>) => {
  app.get('/courses/health', (c) => respond(c, success({ status: 'ok', feature: 'course-catalog' })));

  app.get('/courses', async (c) => {
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = CourseFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return respond(c, failure(400, 'INVALID_COURSE_FILTERS', 'Invalid filters', parsed.error.format()));
    }
    const supabase = getSupabase(c);
    const result = await getCourses(supabase, parsed.data);
    return respond(c, result);
  });
};


