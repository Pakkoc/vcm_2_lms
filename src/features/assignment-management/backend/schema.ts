import { z } from 'zod';

export const AssignmentCreateSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  due_date: z.string(),
  weight: z.number().int().min(0).max(100),
  allow_late: z.boolean().default(false),
  allow_resubmission: z.boolean().default(false),
});

export const AssignmentUpdateSchema = AssignmentCreateSchema.partial();

export const AssignmentStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'closed']),
});


