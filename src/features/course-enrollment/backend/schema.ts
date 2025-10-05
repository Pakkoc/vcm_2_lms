import { z } from 'zod';

export const EnrollRequestSchema = z.object({
  courseId: z.string().uuid(),
});

export const UnenrollParamsSchema = z.object({
  enrollmentId: z.string().uuid(),
});

export type EnrollRequest = z.infer<typeof EnrollRequestSchema>;
export type UnenrollParams = z.infer<typeof UnenrollParamsSchema>;


