import { z } from 'zod';

export const GradingRequestSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(10).max(2000),
  action: z.enum(['grade', 'regrade', 'resubmission_required']).default('grade'),
});

export const BatchGradingSchema = z.object({
  submissionIds: z.array(z.string().uuid()).min(1),
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(10).max(2000),
});


