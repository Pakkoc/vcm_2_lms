import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { CourseCreateSchema, CourseUpdateSchema, CourseStatusSchema } from './schema';
import { createCourse, updateCourse, updateCourseStatus } from './service';

export const registerCourseManagementRoutes = (app: Hono<AppEnv>) => {
  app.get('/courses/manage/health', (c) => respond(c, success({ status: 'ok', feature: 'course-management' })));
  app.post('/courses', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const body = await c.req.json();
    const parsed = CourseCreateSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_COURSE', 'Invalid course payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await createCourse(supabase, instructorId, parsed.data);
    return respond(c, result);
  });

  app.put('/courses/:id', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const courseId = c.req.param('id');
    const body = await c.req.json();
    const parsed = CourseUpdateSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_COURSE', 'Invalid course payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await updateCourse(supabase, courseId, instructorId, parsed.data);
    return respond(c, result);
  });

  app.patch('/courses/:id/status', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const courseId = c.req.param('id');
    const body = await c.req.json();
    const parsed = CourseStatusSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_STATUS', 'Invalid status payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await updateCourseStatus(supabase, courseId, instructorId, parsed.data.status);
    return respond(c, result);
  });
};


