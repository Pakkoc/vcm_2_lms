import type { Hono } from 'hono';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { GradingRequestSchema, BatchGradingSchema } from './schema';
import { gradeSubmission, batchGradeSubmissions } from './service';

export const registerSubmissionGradingRoutes = (app: Hono<AppEnv>) => {
  app.get('/grading/health', (c) => respond(c, success({ status: 'ok', feature: 'submission-grading' })));
  app.post('/grading/submissions/:id/grade', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const submissionId = c.req.param('id');
    const body = await c.req.json();
    const parsed = GradingRequestSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_GRADING', 'Invalid payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await gradeSubmission(supabase, {
      submissionId,
      instructorId,
      ...(parsed.data as { score: number; feedback: string; action: 'grade' | 'regrade' | 'resubmission_required' }),
    });
    return respond(c, result);
  });

  app.post('/grading/batch-grade', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const body = await c.req.json();
    const parsed = BatchGradingSchema.safeParse(body);
    if (!parsed.success) return respond(c, failure(400, 'INVALID_BATCH', 'Invalid payload', parsed.error.format()));
    const supabase = getSupabase(c);
    const result = await batchGradeSubmissions(supabase, {
      instructorId,
      ...(parsed.data as { submissionIds: string[]; score: number; feedback: string }),
    });
    return respond(c, result);
  });
};


