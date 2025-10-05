import { z } from 'zod';

export const AssignmentDetailParamsSchema = z.object({
  assignmentId: z.string().uuid(),
});

export const AssignmentDetailResponseSchema = z.object({
  assignment: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    dueDate: z.string(),
    weight: z.number().int(),
    allowLate: z.boolean(),
    allowResubmission: z.boolean(),
    status: z.enum(['draft', 'published', 'closed']),
  }),
  submission: z
    .object({
      id: z.string().uuid(),
      status: z.enum(['submitted', 'graded', 'resubmission_required']).nullable(),
      isLate: z.boolean().nullable(),
    })
    .nullable(),
  canSubmit: z.boolean(),
  policies: z.object({ allowLate: z.boolean(), allowResubmission: z.boolean() }),
});

export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;


