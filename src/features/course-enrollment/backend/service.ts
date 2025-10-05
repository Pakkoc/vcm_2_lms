import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import type { Database, TableRow } from "@/lib/supabase/types";
import type { EnrollRequest } from "./schema";

export type EnrollmentError =
  | "COURSE_NOT_FOUND"
  | "COURSE_NOT_PUBLISHED"
  | "ALREADY_ENROLLED"
  | "CAPACITY_REACHED"
  | "ENROLLMENT_FAILED"
  | "ENROLLMENT_NOT_FOUND"
  | "ENROLLMENT_ALREADY_CANCELLED"
  | "CANCEL_FAILED";

type CourseRow = Pick<
  TableRow<"courses">,
  "id" | "status" | "max_students" | "enrolled_count" | "published_at"
>;

type EnrollmentRow = Pick<TableRow<"enrollments">, "id" | "course_id" | "cancelled_at">;

const isCourseFull = (course: CourseRow) => {
  if (typeof course.max_students !== "number" || course.max_students <= 0) {
    return false;
  }

  return (course.enrolled_count ?? 0) >= course.max_students;
};

export const enroll = async (
  client: SupabaseClient<Database>,
  learnerId: string,
  payload: EnrollRequest,
): Promise<HandlerResult<{ enrollmentId: string; courseId: string }, EnrollmentError, unknown>> => {
  const { data: course, error: courseError } = await client
    .from("courses")
    .select("id,status,max_students,enrolled_count,published_at")
    .eq("id", payload.courseId)
    .maybeSingle();

  if (courseError || !course) {
    return failure(404, "COURSE_NOT_FOUND", courseError?.message ?? "Course not found");
  }
  if (course.status !== "published") {
    return failure(400, "COURSE_NOT_PUBLISHED", "Course is not published");
  }

  const { data: existing, error: existingError } = await client
    .from("enrollments")
    .select("id")
    .eq("course_id", payload.courseId)
    .eq("learner_id", learnerId)
    .is("cancelled_at", null)
    .maybeSingle();

  if (existingError) {
    return failure(500, "ENROLLMENT_FAILED", existingError.message);
  }

  if (existing) {
    return failure(409, "ALREADY_ENROLLED", "Learner already enrolled");
  }

  if (isCourseFull(course)) {
    return failure(400, "CAPACITY_REACHED", "Course capacity reached");
  }

  const { data: created, error: createError } = await client
    .from("enrollments")
    .insert({ course_id: payload.courseId, learner_id: learnerId })
    .select("id, course_id")
    .maybeSingle();

  if (createError || !created) {
    return failure(500, "ENROLLMENT_FAILED", createError?.message ?? "Failed to enroll");
  }

  await client
    .from("courses")
    .update({ enrolled_count: (course.enrolled_count ?? 0) + 1 })
    .eq("id", payload.courseId);

  return success({ enrollmentId: created.id, courseId: created.course_id }, 201);
};

export const cancelEnrollment = async (
  client: SupabaseClient<Database>,
  learnerId: string,
  enrollmentId: string,
): Promise<HandlerResult<{ cancelledAt: string; courseId: string }, EnrollmentError, unknown>> => {
  const { data: enrollment, error: fetchError } = await client
    .from("enrollments")
    .select("id, course_id, cancelled_at")
    .eq("id", enrollmentId)
    .eq("learner_id", learnerId)
    .maybeSingle();

  if (fetchError) {
    return failure(500, "CANCEL_FAILED", fetchError.message);
  }

  if (!enrollment) {
    return failure(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  }

  if (enrollment.cancelled_at !== null) {
    return failure(409, "ENROLLMENT_ALREADY_CANCELLED", "Enrollment already cancelled");
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("enrollments")
    .update({ cancelled_at: nowIso })
    .eq("id", enrollmentId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return failure(500, "CANCEL_FAILED", error?.message ?? "Failed to cancel");
  }

  const { data: courseAfter, error: courseReadError } = await client
    .from("courses")
    .select("enrolled_count")
    .eq("id", enrollment.course_id)
    .maybeSingle();

  if (!courseReadError && courseAfter && typeof courseAfter.enrolled_count === "number") {
    const nextCount = Math.max(0, courseAfter.enrolled_count - 1);
    await client.from("courses").update({ enrolled_count: nextCount }).eq("id", enrollment.course_id);
  }

  return success({ cancelledAt: nowIso, courseId: enrollment.course_id });
};
