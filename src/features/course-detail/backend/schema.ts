import { z } from "zod";
import {
  BaseCourseCategorySchema,
  BaseCourseDifficultySchema,
  BaseCourseInstructorSchema,
  CourseCategorySchema,
  CourseDifficultySchema,
} from "@/features/course-catalog/backend/schema";

export const CourseDetailParamsSchema = z.object({
  courseId: z.string().uuid(),
});

export const CourseDetailCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  curriculum: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().datetime().nullable(),
  archivedAt: z.string().datetime().nullable(),
  maxStudents: z.number().int().positive().nullable(),
  enrolledCount: z.number().int().nonnegative(),
  category: CourseCategorySchema,
  difficulty: CourseDifficultySchema,
});

export const CourseDetailInstructorSchema = BaseCourseInstructorSchema.extend({
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  contactHours: z.string().nullable().optional(),
  yearsOfExperience: z.number().int().min(0).nullable().optional(),
  expertise: z.array(z.string()).nullable().optional(),
});

export const CourseDetailAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  dueDate: z.string().datetime(),
  status: z.enum(["draft", "published", "closed"]),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  weight: z.number().int().nonnegative(),
});

export const CourseViewerContextSchema = z.object({
  role: z.enum(["learner", "instructor", "operator"]).nullable(),
  isOwner: z.boolean(),
  isEnrolled: z.boolean(),
  enrollmentId: z.string().uuid().nullable(),
  canEnroll: z.boolean(),
  canCancel: z.boolean(),
  canManage: z.boolean(),
});

export const CourseDetailResponseSchema = z.object({
  course: CourseDetailCourseSchema,
  instructor: CourseDetailInstructorSchema,
  assignments: z.array(CourseDetailAssignmentSchema),
  metrics: z.object({
    enrolledCount: z.number().int().nonnegative(),
    capacity: z.number().int().positive().nullable(),
    isFull: z.boolean(),
  }),
  viewer: CourseViewerContextSchema,
});

export type CourseDetailParams = z.infer<typeof CourseDetailParamsSchema>;
export type CourseDetailResponse = z.infer<typeof CourseDetailResponseSchema>;
