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
      .select('id, assignments!inner(course_id, courses!inner(instructor_id))', { count: 'exact' })
      .is('score', null)
      .eq('status', 'submitted')
      .eq('assignments.courses.instructor_id', instructorId);

    // 최근 제출물: 강사 소유 코스 → 해당 과제 목록 → 해당 과제의 최근 제출(미채점/재제출)
    const courseIds = (courses ?? []).map((c: any) => c.id);
    const { data: assignmentRows } = await client
      .from('assignments')
      .select('id, title, course_id')
      .in('course_id', courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000']);

    const assignmentIds = (assignmentRows ?? []).map((a: any) => a.id);

    const { data: recent } = await client
      .from('submissions')
      .select('id, submitted_at, created_at, status, assignment_id')
      .in('assignment_id', assignmentIds.length ? assignmentIds : ['00000000-0000-0000-000000000000'])
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(20);

    const response: InstructorDashboardResponse = {
      courses: (courses ?? []).map((c: any) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        enrollmentCount: c.enrolled_count ?? 0,
      })),
      pendingGrading: (pending as any)?.length ?? 0,
      recentSubmissions: (recent ?? []).map((r: any) => {
        const a = (assignmentRows ?? []).find((x: any) => x.id === r.assignment_id);
        const course = (courses ?? []).find((c: any) => c.id === a?.course_id);
        return {
          submissionId: r.id,
          assignmentTitle: a?.title ?? 'Assignment',
          courseTitle: course?.title ?? 'Course',
          learnerName: null,
          status: r.status,
          submittedAt: r.submitted_at,
        };
      }),
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


