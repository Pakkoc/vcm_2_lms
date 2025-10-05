import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { LearnerDashboardResponse } from './schema';

type DashboardError = 'DASHBOARD_FETCH_FAILED';

export const getLearnerDashboard = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<LearnerDashboardResponse, DashboardError, unknown>> => {
  try {
    // 수강 코스
    const { data: enrollments, error: enrollErr } = await client
      .from('enrollments')
      .select('course_id, courses(title)')
      .eq('learner_id', userId)
      .is('cancelled_at', null);
    if (enrollErr) return failure(500, 'DASHBOARD_FETCH_FAILED', enrollErr.message);

    const courses = (enrollments ?? []).map((e: any) => ({
      courseId: e.course_id as string,
      title: e.courses?.title ?? 'Course',
      // 최소 동작: 진행률 0으로 초기화 (실 구현은 submissions/assignments로 계산)
      progress: 0,
    }));

    // 마감 임박 (7일)
    const { data: deadlines } = await client
      .from('assignments')
      .select('id, title, due_date, course_id')
      .in('course_id', courses.map((c) => c.courseId))
      .gte('due_date', new Date().toISOString())
      .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'published')
      .order('due_date', { ascending: true });

    // 최근 피드백 5개
    const { data: recents } = await client
      .from('submissions')
      .select('id, updated_at, score, assignment_id, assignments(title, course_id, courses(title))')
      .eq('learner_id', userId)
      .not('feedback', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    const response: LearnerDashboardResponse = {
      courses,
      upcomingDeadlines: (deadlines ?? []).map((a: any) => ({
        assignmentId: a.id,
        title: a.title,
        dueDate: a.due_date,
      })),
      recentFeedback: (recents ?? []).map((s: any) => ({
        submissionId: s.id,
        courseTitle: s.assignments?.courses?.title ?? 'Course',
        assignmentTitle: s.assignments?.title ?? 'Assignment',
        score: typeof s.score === 'number' ? s.score : null,
        updatedAt: s.updated_at,
      })),
      stats: {
        totalCourses: courses.length,
        averageProgress: courses.length ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0,
      },
    };

    return success(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return failure(500, 'DASHBOARD_FETCH_FAILED', message);
  }
};


