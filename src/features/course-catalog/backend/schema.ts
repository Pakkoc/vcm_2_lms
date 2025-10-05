import { z } from 'zod';

export const CourseFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  difficulty: z.string().uuid().optional(),
  sort: z.enum(['latest', 'popular']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const CourseSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  enrolledCount: z.number().int().nonnegative(),
  status: z.enum(['draft', 'published', 'archived']),
});

export type CourseFilters = z.infer<typeof CourseFiltersSchema>;
export type CourseSummary = z.infer<typeof CourseSummarySchema>;


