import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import type { Database, TableRow } from "@/lib/supabase/types";
import type { UserRole } from "@/constants/roles";
import type { CourseDetailResponse } from "./schema";

export type CourseDetailError =
  | "COURSE_NOT_FOUND"
  | "COURSE_ACCESS_DENIED"
  | "COURSE_DETAIL_FETCH_FAILED";

type GetCourseDetailOptions = {
  viewerId?: string | null;
  viewerRole?: UserRole | null;
};

type CourseDetailRow = TableRow<"courses"> & {
  categories: Pick<TableRow<"categories">, "id" | "name"> | null;
  difficulty: Pick<TableRow<"difficulty_levels">, "id" | "name" | "level"> | null;
  instructorProfile: Pick<TableRow<"profiles">, "id" | "name" | "avatar_url"> | null;
};

type AssignmentRow = Pick<
  TableRow<"assignments">,
  "id" | "title" | "due_date" | "status" | "allow_late" | "allow_resubmission" | "weight"
>;

export const getCourseDetail = async (
  client: SupabaseClient<Database>,
  courseId: string,
  options: GetCourseDetailOptions = {},
): Promise<HandlerResult<CourseDetailResponse, CourseDetailError, unknown>> => {
  try {
    const selectColumns = `
      id,
      title,
      summary,
      description,
      curriculum,
      status,
      published_at,
      archived_at,
      max_students,
      enrolled_count,
      instructor_id,
      categories:categories(id,name),
      difficulty:difficulty_levels(id,name,level),
      instructorProfile:profiles!courses_instructor_id_fkey(id,name,avatar_url)
    `;

    const { data: course, error: courseError } = await client
      .from("courses")
      .select(selectColumns)
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) {
      return failure(500, "COURSE_DETAIL_FETCH_FAILED", courseError.message);
    }
    if (!course) {
      return failure(404, "COURSE_NOT_FOUND", "Course not found");
    }

    const viewerId = options.viewerId ?? null;
    const viewerRole = options.viewerRole ?? null;
    const isOwner = Boolean(viewerId && viewerId === course.instructor_id);

    const isPublished = course.status === "published";
    if (!isPublished && !isOwner && viewerRole !== "operator") {
      return failure(403, "COURSE_ACCESS_DENIED", "Course is not accessible");
    }

    const instructorProfile = (course as { instructorProfile?: { id?: string; name?: string | null; avatar_url?: string | null } }).instructorProfile ?? null;
    const maxStudents = typeof course.max_students === "number" ? course.max_students : null;
    const enrolledCount = course.enrolled_count ?? 0;
    const isFull = Boolean(maxStudents) && enrolledCount >= Number(maxStudents);

    let enrollmentId: string | null = null;
    let isEnrolled = false;
    if (viewerId && viewerRole === "learner") {
      const { data: enrollment, error: enrollmentError } = await client
        .from("enrollments")
        .select("id, cancelled_at")
        .eq("course_id", courseId)
        .eq("learner_id", viewerId)
        .order("enrolled_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (enrollmentError) {
        return failure(500, "COURSE_DETAIL_FETCH_FAILED", enrollmentError.message);
      }

      if (enrollment && enrollment.cancelled_at === null) {
        enrollmentId = enrollment.id;
        isEnrolled = true;
      }
    }

    const { data: assignmentRows, error: assignmentError } = await client
      .from("assignments")
      .select("id,title,due_date,status,allow_late,allow_resubmission,weight")
      .eq("course_id", courseId)
      .order("due_date", { ascending: true });

    if (assignmentError) {
      return failure(500, "COURSE_DETAIL_FETCH_FAILED", assignmentError.message);
    }

    const response: CourseDetailResponse = {
      course: {
        id: course.id,
        title: course.title,
        summary: course.summary ?? null,
        description: course.description ?? null,
        curriculum: course.curriculum ?? null,
        status: course.status,
        publishedAt: course.published_at ?? null,
        archivedAt: course.archived_at ?? null,
        maxStudents,
        enrolledCount,
        category: course.categories
          ? {
              id: course.categories.id,
              name: course.categories.name,
            }
          : null,
        difficulty: course.difficulty
          ? {
              id: course.difficulty.id,
              name: course.difficulty.name,
              level: course.difficulty.level ?? 0,
            }
          : null,
      },
      instructor: {
        id: instructorProfile?.id ?? course.instructor_id,
        name: instructorProfile?.name ?? null,
        avatarUrl: instructorProfile?.avatar_url ?? null,
      },
      assignments: (assignmentRows ?? []).map((assignment: AssignmentRow) => ({
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.due_date,
        status: assignment.status,
        allowLate: assignment.allow_late,
        allowResubmission: assignment.allow_resubmission,
        weight: assignment.weight ?? 0,
      })),
      metrics: {
        enrolledCount,
        capacity: maxStudents,
        isFull,
      },
      viewer: {
        role: viewerRole,
        isOwner,
        isEnrolled,
        enrollmentId,
        canEnroll: viewerRole === "learner" && !isEnrolled && !isFull && course.status === "published",
        canCancel: viewerRole === "learner" && isEnrolled,
        canManage: isOwner || viewerRole === "operator",
      },
    };

    return success(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return failure(500, "COURSE_DETAIL_FETCH_FAILED", message);
  }
};
