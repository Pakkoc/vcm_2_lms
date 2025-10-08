import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import type { AssignmentSubmissionsResponse } from './schema';

export const registerSubmissionHistoryRoutes = (app: Hono<AppEnv>) => {
  app.get('/submissions/history/health', (c) => respond(c, success({ status: 'ok', feature: 'submission-history' })));
  // 과제별 제출물 목록 - 강사 권한
  app.get('/submissions/assignments/:id', async (c) => {
    const instructorId = c.req.header('x-user-id') ?? '';
    if (!instructorId) return respond(c, failure(401, 'UNAUTHORIZED', 'Missing user context'));
    const assignmentId = c.req.param('id');
    const supabase = getSupabase(c);

    // 권한 확인: 해당 과제가 강사 소유 코스에 속하는지
    const { data: assignment, error: aErr } = await supabase
      .from('assignments')
      .select('id, title, courses!inner(instructor_id)')
      .eq('id', assignmentId)
      .maybeSingle();
    const ownerId = (assignment as any)?.courses?.instructor_id;
    if (aErr || !assignment || ownerId !== instructorId) {
      return respond(c, failure(403, 'FORBIDDEN', 'Not allowed'));
    }

    const { data: subs, error: sErr } = await supabase
      .from('submissions')
      .select('id, learner_id, status, score, feedback, is_late, submitted_at')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
      .order('updated_at', { ascending: false });
    if (sErr) return respond(c, failure(500, 'SUBMISSION_LIST_FAILED', sErr.message));

    const payload: AssignmentSubmissionsResponse = {
      assignmentId,
      assignmentTitle: (assignment as any).title ?? 'Assignment',
      submissions: (subs ?? []).map((r: any) => ({
        submissionId: r.id,
        learnerId: r.learner_id,
        learnerName: null,
        status: r.status,
        score: typeof r.score === 'number' ? r.score : null,
        feedback: r.feedback ?? null,
        isLate: !!r.is_late,
        submittedAt: r.submitted_at,
      })),
    };

    return respond(c, success(payload));
  });
};


