import { z } from 'zod';

export const InstructorDashboardResponseSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      status: z.enum(['draft', 'published', 'archived']),
      enrollmentCount: z.number().int().nonnegative().optional(),
    }),
  ),
  pendingGrading: z.number().int().nonnegative(),
  recentSubmissions: z.array(
    z.object({
      submissionId: z.string().uuid(),
      assignmentTitle: z.string(),
      courseTitle: z.string(),
      learnerName: z.string().nullable(),
      submittedAt: z.string(),
    }),
  ),
  statistics: z.object({
    totalCourses: z.number().int().nonnegative(),
    publishedCourses: z.number().int().nonnegative(),
  }),
});

export type InstructorDashboardResponse = z.infer<typeof InstructorDashboardResponseSchema>;


