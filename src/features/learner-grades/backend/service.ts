import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { LearnerGradesResponse } from './schema';

type GradesError = 'GRADES_FETCH_FAILED';

export const getLearnerGrades = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<LearnerGradesResponse, GradesError, unknown>> => {
  try {
    const { data: enrollments, error: enrollErr } = await client
      .from('enrollments')
      .select('course_id, courses(title)')
      .eq('learner_id', userId)
      .is('cancelled_at', null);
    if (enrollErr) return failure(500, 'GRADES_FETCH_FAILED', enrollErr.message);

    const courses = (enrollments ?? []).map((e: any) => ({ id: e.course_id as string, title: e.courses?.title ?? 'Course' }));

    const result: LearnerGradesResponse = {
      courses: await Promise.all(
        courses.map(async (c) => {
          const { data: rows } = await client
            .from('assignments')
            .select('id, title, weight, max_score, submissions(score, is_late, feedback)')
            .eq('course_id', c.id);

          const assignments = (rows ?? []).map((r: any) => {
            const score: number | null = r.submissions?.[0]?.score ?? null;
            const max = typeof r.max_score === 'number' ? r.max_score : 100;
            const percentage = score === null ? null : Math.round((score / max) * 100);
            const feedbackHtml = r.submissions?.[0]?.feedback ?? null;
            return {
              assignmentId: r.id,
              assignmentTitle: r.title,
              score,
              percentage,
              isLate: r.submissions?.[0]?.is_late ?? null,
              feedbackHtml,
            };
          });

          const graded = assignments.filter((a) => a.score !== null);
          const totalScore = graded.reduce((sum, a) => sum + (a!.score as number), 0);
          const averageScore = graded.length ? Math.round(totalScore / graded.length) : 0;
          const progress = assignments.length ? Math.round((graded.length / assignments.length) * 100) : 0;

          return {
            courseId: c.id,
            courseTitle: c.title,
            assignments,
            totalScore,
            averageScore,
            progress,
          };
        }),
      ),
    };

    return success(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return failure(500, 'GRADES_FETCH_FAILED', message);
  }
};


