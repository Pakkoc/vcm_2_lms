import { z } from 'zod';

export const CourseCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
  category_id: z.string().uuid(),
  difficulty_id: z.string().uuid(),
  curriculum: z.string().optional(),
  max_students: z.number().int().min(1).max(100000).optional(),
});

export const CourseUpdateSchema = CourseCreateSchema.partial();

export const CourseStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

export type CourseCreate = z.infer<typeof CourseCreateSchema>;
export type CourseUpdate = z.infer<typeof CourseUpdateSchema>;


