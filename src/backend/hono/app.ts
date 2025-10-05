import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerAuthOnboardingRoutes } from '@/features/auth-onboarding/backend/route';
import { registerCourseCatalogRoutes } from '@/features/course-catalog/backend/route';
import { registerCourseEnrollmentRoutes } from '@/features/course-enrollment/backend/route';
import { registerLearnerDashboardRoutes } from '@/features/learner-dashboard/backend/route';
import { registerAssignmentDetailRoutes } from '@/features/assignment-detail/backend/route';
import { registerAssignmentSubmissionRoutes } from '@/features/assignment-submission/backend/route';
import { registerLearnerGradesRoutes } from '@/features/learner-grades/backend/route';
import { registerInstructorDashboardRoutes } from '@/features/instructor-dashboard/backend/route';
import { registerCourseManagementRoutes } from '@/features/course-management/backend/route';
import { registerAssignmentManagementRoutes } from '@/features/assignment-management/backend/route';
import { registerSubmissionGradingRoutes } from '@/features/submission-grading/backend/route';
import { registerAssignmentLifecycleRoutes } from '@/features/assignment-lifecycle/backend/route';
import { registerAdminDashboardRoutes } from '@/features/admin-dashboard/backend/route';
import { registerReportManagementRoutes } from '@/features/report-management/backend/route';
import { registerMetadataManagementRoutes } from '@/features/metadata-management/backend/route';
import { registerGradingHistoryRoutes } from '@/features/grading-history/backend/route';
import { registerSubmissionHistoryRoutes } from '@/features/submission-history/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  // Feature routes
  registerAuthOnboardingRoutes(app);
  registerCourseCatalogRoutes(app);
  registerCourseEnrollmentRoutes(app);
  registerLearnerDashboardRoutes(app);
  registerAssignmentDetailRoutes(app);
  registerAssignmentSubmissionRoutes(app);
  registerLearnerGradesRoutes(app);
  registerInstructorDashboardRoutes(app);
  registerCourseManagementRoutes(app);
  registerAssignmentManagementRoutes(app);
  registerSubmissionGradingRoutes(app);
  registerAssignmentLifecycleRoutes(app);
  registerAdminDashboardRoutes(app);
  registerReportManagementRoutes(app);
  registerMetadataManagementRoutes(app);
  registerGradingHistoryRoutes(app);
  registerSubmissionHistoryRoutes(app);

  singletonApp = app;

  return app;
};
