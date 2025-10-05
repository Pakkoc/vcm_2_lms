import { z } from 'zod';

export const AssignmentScoreSchema = z.object({
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  score: z.number().int().nullable(),
  percentage: z.number().int().nullable(),
  isLate: z.boolean().nullable(),
  feedbackHtml: z.string().nullable(),
});

export const CourseGradesSchema = z.object({
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  assignments: z.array(AssignmentScoreSchema),
  totalScore: z.number().int(),
  averageScore: z.number().int(),
  progress: z.number().int(),
});

export const LearnerGradesResponseSchema = z.object({
  courses: z.array(CourseGradesSchema),
});

export type LearnerGradesResponse = z.infer<typeof LearnerGradesResponseSchema>;


