import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { EnrollRequestSchema, UnenrollParamsSchema } from './schema';
import { enroll, cancelEnrollment } from './service';

export const registerCourseEnrollmentRoutes = (app: Hono<AppEnv>) => {
  app.get('/enrollments/health', (c) => respond(c, success({ status: 'ok', feature: 'course-enrollment' })));

  app.post('/enrollments', async (c) => {
    const body = await c.req.json();
    const parsed = EnrollRequestSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, failure(400, 'INVALID_ENROLLMENT', 'Invalid enrollment payload', parsed.error.format()));
    }
    // 현재 사용자 ID는 인증 계층에서 주입되어야 하나, 여기서는 헤더로 전달된다고 가정
    const learnerId = c.req.header('x-user-id') ?? '';
    if (!learnerId) {
      return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    }
    const supabase = getSupabase(c);
    const result = await enroll(supabase, learnerId, parsed.data);
    return respond(c, result);
  });

  app.delete('/enrollments/:id', async (c) => {
    const parsed = UnenrollParamsSchema.safeParse({ enrollmentId: c.req.param('id') });
    if (!parsed.success) {
      return respond(c, failure(400, 'INVALID_ENROLLMENT_ID', 'Invalid enrollment id', parsed.error.format()));
    }
    const supabase = getSupabase(c);
    const result = await cancelEnrollment(supabase, parsed.data.enrollmentId);
    return respond(c, result);
  });
};


