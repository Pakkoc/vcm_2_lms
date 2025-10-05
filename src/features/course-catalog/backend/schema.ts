import { z } from "zod";

export const CourseSortSchema = z.enum(["latest", "popular"]);

export const CourseFiltersSchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.string().uuid().optional(),
  difficulty: z.string().uuid().optional(),
  sort: CourseSortSchema.optional().default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const BaseCourseCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const BaseCourseDifficultySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  level: z.number().int().nonnegative(),
});

export const BaseCourseInstructorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
});

export const CourseCategorySchema = BaseCourseCategorySchema.nullable();
export const CourseDifficultySchema = BaseCourseDifficultySchema.nullable();
export const CourseInstructorSchema = BaseCourseInstructorSchema.nullable();

export const CourseCategoryOptionSchema = BaseCourseCategorySchema;
export const CourseDifficultyOptionSchema = BaseCourseDifficultySchema;

export const CourseListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  enrolledCount: z.number().int().nonnegative(),
  maxStudents: z.number().int().positive().nullable(),
  category: CourseCategorySchema,
  difficulty: CourseDifficultySchema,
  instructor: CourseInstructorSchema,
  enrollmentId: z.string().uuid().nullable(),
  isEnrolled: z.boolean(),
  isFull: z.boolean(),
  canEnroll: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
});

export const CourseListResponseSchema = z.object({
  items: z.array(CourseListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
});

export type CourseSort = z.infer<typeof CourseSortSchema>;
export type CourseFilters = z.infer<typeof CourseFiltersSchema>;
export type CourseCategory = z.infer<typeof CourseCategorySchema>;
export type CourseDifficulty = z.infer<typeof CourseDifficultySchema>;
export type CourseInstructor = z.infer<typeof CourseInstructorSchema>;
export type CourseCategoryOption = z.infer<typeof CourseCategoryOptionSchema>;
export type CourseDifficultyOption = z.infer<typeof CourseDifficultyOptionSchema>;
export type CourseListItem = z.infer<typeof CourseListItemSchema>;
export type CourseListResponse = z.infer<typeof CourseListResponseSchema>;
