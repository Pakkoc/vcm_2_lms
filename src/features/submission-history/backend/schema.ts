import { z } from 'zod';

export const AssignmentSubmissionItemSchema = z.object({
  submissionId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  isLate: z.boolean(),
  submittedAt: z.string(),
});

export const AssignmentSubmissionsResponseSchema = z.object({
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  submissions: z.array(AssignmentSubmissionItemSchema),
});

export type AssignmentSubmissionsResponse = z.infer<typeof AssignmentSubmissionsResponseSchema>;


