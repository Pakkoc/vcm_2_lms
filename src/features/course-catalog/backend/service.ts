import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import type { Database } from "@/lib/supabase/types";
import type {
  CourseFilters,
  CourseListItem,
  CourseListResponse,
  CourseCategoryOption,
  CourseDifficultyOption,
} from "./schema";

export type CatalogError = "CATALOG_FETCH_FAILED";
export type TaxonomyError = "CATALOG_TAXONOMY_FETCH_FAILED";

type GetCoursesOptions = {
  viewerId?: string | null;
};

type CourseRow = {
  id: string;
  title: string;
  summary: string | null;
  thumbnail_url: string | null;
  status: Database["public"]["Enums"]["course_status"];
  max_students: number | null;
  enrolled_count: number | null;
  published_at: string | null;
  instructor_id: string;
  categories: { id: string; name: string } | null;
  difficulty: { id: string; name: string; level: number | null } | null;
  instructor: { id: string; name: string | null } | null;
};

type ActiveEnrollmentRow = { id: string; course_id: string };

const mapRowToItem = (
  row: CourseRow,
  enrollmentLookup: Map<string, string>,
): CourseListItem => {
  const maxStudents = typeof row.max_students === "number" ? row.max_students : null;
  const enrolledCount = row.enrolled_count ?? 0;
  const isFull = Boolean(maxStudents) && enrolledCount >= Number(maxStudents);
  const enrollmentId = enrollmentLookup.get(row.id) ?? null;
  const isEnrolled = Boolean(enrollmentId);

  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
    status: row.status,
    enrolledCount,
    maxStudents,
    category: row.categories ? { id: row.categories.id, name: row.categories.name } : null,
    difficulty: row.difficulty
      ? {
          id: row.difficulty.id,
          name: row.difficulty.name,
          level: row.difficulty.level ?? 0,
        }
      : null,
    instructor: row.instructor
      ? {
          id: row.instructor.id,
          name: row.instructor.name ?? null,
        }
      : {
          id: row.instructor_id,
          name: null,
        },
    enrollmentId,
    isEnrolled,
    isFull,
    canEnroll: row.status === "published" && !isEnrolled && !isFull,
    publishedAt: row.published_at ?? null,
  };
};

const buildSearchFilter = (search: string) => {
  const sanitized = search.replace(/%/g, "");
  const term = `%${sanitized}%`;
  return `title.ilike.${term},summary.ilike.${term},description.ilike.${term}`;
};

export const getCourses = async (
  client: SupabaseClient<Database>,
  filters: CourseFilters,
  options: GetCoursesOptions = {},
): Promise<HandlerResult<CourseListResponse, CatalogError, unknown>> => {
  try {
    const { search, category, difficulty, sort = "latest", page, limit } = filters;

    const selectColumns = `
      id,
      title,
      summary,
      thumbnail_url,
      status,
      max_students,
      enrolled_count,
      published_at,
      instructor_id,
      categories:categories(id,name),
      difficulty:difficulty_levels(id,name,level),
      instructor:profiles!courses_instructor_id_fkey(id,name)
    `;

    let query = client
      .from("courses")
      .select(selectColumns, { count: "exact" })
      .eq("status", "published");

    if (search) {
      query = query.or(buildSearchFilter(search));
    }
    if (category) {
      query = query.eq("category_id", category);
    }
    if (difficulty) {
      query = query.eq("difficulty_id", difficulty);
    }

    if (sort === "popular") {
      query = query.order("enrolled_count", { ascending: false, nullsFirst: false });
    } else {
      query = query.order("published_at", { ascending: false, nullsFirst: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return failure(500, "CATALOG_FETCH_FAILED", error.message);
    }

    const courseRows = (data ?? []) as unknown as CourseRow[];
    const courseIds = courseRows.map((row) => row.id);

    const enrollmentLookup = new Map<string, string>();
    const viewerId = options.viewerId ?? null;
    if (viewerId && courseIds.length > 0) {
      const { data: enrollments, error: enrollmentError } = await client
        .from("enrollments")
        .select("id, course_id")
        .eq("learner_id", viewerId)
        .is("cancelled_at", null)
        .in("course_id", courseIds);

      if (enrollmentError) {
        return failure(500, "CATALOG_FETCH_FAILED", enrollmentError.message);
      }

      (enrollments ?? []).forEach((row: ActiveEnrollmentRow) => {
        enrollmentLookup.set(row.course_id, row.id);
      });
    }

    const items = courseRows.map((row) => mapRowToItem(row, enrollmentLookup));

    return success({
      items,
      total: count ?? items.length,
      page,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return failure(500, "CATALOG_FETCH_FAILED", message);
  }
};

export const getCourseCategories = async (
  client: SupabaseClient<Database>,
): Promise<HandlerResult<{ categories: CourseCategoryOption[] }, TaxonomyError, unknown>> => {
  try {
    const { data, error } = await client
      .from("categories")
      .select("id,name")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      return failure(500, "CATALOG_TAXONOMY_FETCH_FAILED", error.message);
    }

    const categories = (data ?? []).map((row) => ({ id: row.id, name: row.name }));
    return success({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return failure(500, "CATALOG_TAXONOMY_FETCH_FAILED", message);
  }
};

export const getDifficultyLevels = async (
  client: SupabaseClient<Database>,
): Promise<HandlerResult<{ difficulties: CourseDifficultyOption[] }, TaxonomyError, unknown>> => {
  try {
    const { data, error } = await client
      .from("difficulty_levels")
      .select("id,name,level")
      .eq("active", true)
      .order("level", { ascending: true });

    if (error) {
      return failure(500, "CATALOG_TAXONOMY_FETCH_FAILED", error.message);
    }

    const difficulties = (data ?? []).map((row) => ({ id: row.id, name: row.name, level: row.level }));
    return success({ difficulties });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return failure(500, "CATALOG_TAXONOMY_FETCH_FAILED", message);
  }
};
