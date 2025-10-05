import { z } from 'zod';

export const SubmissionRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().min(10).max(10000),
  linkUrl: z.string().url().optional().or(z.literal('')),
  attachmentUrl: z.string().url().optional(),
});

export type SubmissionRequest = z.infer<typeof SubmissionRequestSchema>;


