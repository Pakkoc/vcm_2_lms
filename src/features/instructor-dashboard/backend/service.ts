import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { InstructorDashboardResponse } from './schema';

type ErrorCode = 'INSTRUCTOR_DASHBOARD_FAILED';

export const getInstructorDashboard = async (
  client: SupabaseClient,
  instructorId: string,
): Promise<HandlerResult<InstructorDashboardResponse, ErrorCode, unknown>> => {
  try {
    const { data: courses, error: courseErr } = await client
      .from('courses')
      .select('id, title, status, enrolled_count')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });
    if (courseErr) return failure(500, 'INSTRUCTOR_DASHBOARD_FAILED', courseErr.message);

    const { data: pending } = await client
      .from('submissions')
      .select('id, assignments(course_id), assignments!inner(courses!inner(instructor_id))', { count: 'exact' })
      .is('score', null)
      .eq('status', 'submitted');

    const { data: recent } = await client
      .from('submissions')
      .select('id, submitted_at, assignments(title, courses(title, instructor_id)), users:learner_id(name)')
      .order('submitted_at', { ascending: false })
      .limit(10);

    const response: InstructorDashboardResponse = {
      courses: (courses ?? []).map((c: any) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        enrollmentCount: c.enrolled_count ?? 0,
      })),
      pendingGrading: (pending as any)?.length ?? 0,
      recentSubmissions: (recent ?? []).map((r: any) => ({
        submissionId: r.id,
        assignmentTitle: r.assignments?.title ?? 'Assignment',
        courseTitle: r.assignments?.courses?.title ?? 'Course',
        learnerName: r.users?.name ?? null,
        submittedAt: r.submitted_at,
      })),
      statistics: {
        totalCourses: (courses ?? []).length,
        publishedCourses: (courses ?? []).filter((c: any) => c.status === 'published').length,
      },
    };

    return success(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return failure(500, 'INSTRUCTOR_DASHBOARD_FAILED', message);
  }
};


