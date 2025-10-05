import { z } from 'zod';

export const CourseProgressSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string(),
  progress: z.number().int().min(0).max(100),
});

export const DeadlineItemSchema = z.object({
  assignmentId: z.string().uuid(),
  title: z.string(),
  dueDate: z.string(),
});

export const FeedbackItemSchema = z.object({
  submissionId: z.string().uuid(),
  courseTitle: z.string(),
  assignmentTitle: z.string(),
  score: z.number().int().nullable(),
  updatedAt: z.string(),
});

export const LearnerDashboardResponseSchema = z.object({
  courses: z.array(CourseProgressSchema),
  upcomingDeadlines: z.array(DeadlineItemSchema),
  recentFeedback: z.array(FeedbackItemSchema),
  stats: z.object({
    totalCourses: z.number().int(),
    averageProgress: z.number().int(),
  }),
});

export type LearnerDashboardResponse = z.infer<typeof LearnerDashboardResponseSchema>;


